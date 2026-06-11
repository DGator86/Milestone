import { TOOLS, TOOLS_BY_NAME, type ToolContext } from "./tools";

// Google Gemini via its OpenAI-compatible endpoint.
// Free tier: 60 RPM, 1M TPM — far more headroom than Groq's free plan.
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const MAX_STEPS = 6;

// Waterfall: tried in order, falls back automatically on 404/429.
const MODEL_WATERFALL = [
  "gemini-2.5-flash",
  "gemini-3.5-flash",
  "gemini-2.5-flash-lite",
];

export function agentConfigured() {
  return !!process.env.GEMINI_API_KEY;
}

const SYSTEM_PROMPT = `You are Milestone's built-in assistant — a sharp, no-nonsense operator embedded in a goal-centric CRM.

Milestone's core idea: every goal is broken into a sequential PATH of milestones. The user works "the next step" and kills it. The CRM (companies, contacts, deals, tasks) hangs off those goals so business work and personal goals live in one place.

Your job is to help the user:
- Turn vague goals into a concrete goal with 3-6 ordered, specific milestones (use the create_goal tool — never just describe milestones, actually create them when the user wants a goal).
- Work their "kill list": call get_kill_list, then help them decide what to push, complete, archive, or kill. Be opinionated and direct about what to cut.
- Manage CRM records (companies, contacts, deals, tasks) and link goals to accounts so everything is connected.
- When creating tasks for meetings, lunches, or calls: use create_task with type "meeting" (or "call") as appropriate, due_date for the day, and put time + location in the notes field. Never tell the user you cannot store time or location — use notes for that.

Rules of engagement:
- Be conversational and collaborative. Think of yourself as a smart teammate, not an automation script.
- NEVER create, update, or delete anything without the user's explicit confirmation first. Propose what you plan to do and wait for a clear "yes", "go ahead", "do it", or equivalent before calling any mutating tool.
- When the user describes a goal or asks for help planning, outline your suggested milestones in plain text and ask "Want me to create this?" before touching any tool.
- When reading data (list_goals, get_kill_list, etc.) to answer a question, you can call those tools immediately — they don't change anything.
- After proposing an action, keep the ask short: one sentence ending with a yes/no question.
- Once the user confirms, execute cleanly and give a brief recap of what changed plus the single most valuable next step.
- If the user says something ambiguous, ask one focused clarifying question rather than guessing.
- Milestones must be concrete next actions (3-7 words each), ordered, and small enough to finish in days not months.
- When your proposed milestones include any step that involves communicating with someone (e.g. "Schedule meeting", "Send follow-up", "Reach out", "Contact", "Email", "Call"), BEFORE asking "Want me to create this?", ask in a single message: (1) what communication channel to use for each such step (email, phone call, text, LinkedIn, in-person, etc.) and (2) who the specific recipient is if not already clear. Then revise those milestone titles to embed both the channel and person — e.g. "Email Sarah @ Monroe Concrete re: site visit", "Call CEO to schedule Q2 review". Only after getting those answers should you ask for final confirmation.
- Today's date is provided in the first user turn context. Use it for due dates and overdue logic.
- Never invent data you didn't retrieve via a tool. This includes in proposals and suggestions — do NOT make up names, job titles, or contact details for people. If a person's name or role isn't known, use a generic placeholder like "[contact]" or ask the user who to reach out to.`;

interface ClientMessage {
  role: "user" | "assistant";
  content: string;
}

interface GroqMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: GroqToolCall[];
  tool_call_id?: string;
}

interface GroqToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface AgentResponse {
  reply: string;
  actions: string[];
  mutated: boolean;
}

const groqTools = TOOLS.map((t) => ({
  type: "function" as const,
  function: {
    name: t.name,
    description: t.description,
    parameters: t.input_schema,
  },
}));

/**
 * Calls Gemini (via its OpenAI-compatible endpoint) with the given model.
 * Returns null on 404/429 so the caller falls back to the next model in the waterfall.
 * Retries up to 2 extra times on 503 before throwing.
 */
async function callGemini(
  model: string,
  messages: GroqMessage[]
): Promise<Record<string, unknown> | null> {
  for (let attempt = 0; attempt <= 2; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, attempt * 1500));
    const res = await fetch(GEMINI_BASE, {
      method: "POST",
      signal: AbortSignal.timeout(45000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        tools: groqTools,
        tool_choice: "auto",
        max_tokens: 4096,
      }),
    });
    if (res.ok) return res.json() as Promise<Record<string, unknown>>;
    if (res.status === 404 || res.status === 429) return null; // model unavailable or rate limited
    if (res.status === 503 && attempt < 2) continue;
    if (res.status === 503) throw new Error("The AI is busy right now — please try again in a moment.");
    const errBody = await res.json().catch(() => null) as { error?: { message?: string } } | null;
    const detail = errBody?.error?.message;
    throw new Error(detail ? `AI error: ${detail}` : `AI error (${res.status}) — please try again.`);
  }
  return null;
}

/**
 * Run the agent loop: feed history + today's date, let the model call tools
 * against the user's data, and loop until it produces a final text reply.
 * Automatically falls back through MODEL_WATERFALL on rate-limit (429) responses.
 */
export async function runAgent(ctx: ToolContext, history: ClientMessage[]): Promise<AgentResponse> {
  const today = new Date().toISOString().slice(0, 10);

  const messages: GroqMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m, i) => ({
      role: m.role as "user" | "assistant",
      content: i === 0 && m.role === "user" ? `(Today is ${today}.)\n\n${m.content}` : m.content,
    })),
  ];

  // Start at the override model if set, otherwise index 0.
  const overrideModel = process.env.GEMINI_MODEL ?? process.env.GROQ_MODEL;
  let modelIndex = overrideModel ? Math.max(0, MODEL_WATERFALL.indexOf(overrideModel)) : 0;

  const actions: string[] = [];
  let mutated = false;

  for (let step = 0; step < MAX_STEPS; step++) {
    // Walk the waterfall until a model responds (or all are exhausted).
    let data: Record<string, unknown> | null = null;
    while (data === null && modelIndex < MODEL_WATERFALL.length) {
      data = await callGemini(MODEL_WATERFALL[modelIndex], messages);
      if (data === null) modelIndex++;
    }
    if (data === null) {
      throw new Error("All AI models are unavailable right now — please try again in a moment.");
    }

    type Choice = {
      message: { content: string | null; tool_calls?: GroqToolCall[] };
      finish_reason: string;
    };
    const choice = (data.choices as Choice[])?.[0];
    if (!choice) throw new Error("No response from AI");

    const { message, finish_reason } = choice;

    // Append the assistant turn.
    messages.push({
      role: "assistant",
      content: message.content ?? null,
      tool_calls: message.tool_calls,
    });

    if (finish_reason === "stop" || !message.tool_calls?.length) {
      return { reply: message.content ?? "Done.", actions, mutated };
    }

    // Execute each tool call and append results.
    for (const call of message.tool_calls) {
      const { name, arguments: argsStr } = call.function;

      const tool = TOOLS_BY_NAME.get(name);
      let toolContent: string;

      if (!tool) {
        toolContent = JSON.stringify({ error: `Unknown tool: ${name}` });
      } else {
        try {
          let args: Record<string, unknown>;
          try {
            args = JSON.parse(argsStr) as Record<string, unknown>;
          } catch {
            args = {};
          }
          const result = await tool.handler(ctx, args);
          if (result.error) {
            toolContent = JSON.stringify({ error: result.error });
          } else {
            if (tool.mutates) mutated = true;
            if (result.summary) actions.push(result.summary);
            toolContent = JSON.stringify({ ok: true, ...result });
          }
        } catch (err) {
          toolContent = JSON.stringify({ error: err instanceof Error ? err.message : "Tool failed" });
        }
      }

      messages.push({ role: "tool", tool_call_id: call.id, content: toolContent });
    }
  }

  return {
    reply: "I took several steps but stopped to avoid looping. Here's what I did — let me know how to continue.",
    actions,
    mutated,
  };
}
