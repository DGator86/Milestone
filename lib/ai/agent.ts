import { TOOLS, TOOLS_BY_NAME, type ToolContext } from "./tools";

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const MAX_STEPS = 6;

export function agentConfigured() {
  return !!process.env.GEMINI_API_KEY;
}

const SYSTEM_PROMPT = `You are Milestone's built-in assistant — a sharp, no-nonsense operator embedded in a goal-centric CRM.

Milestone's core idea: every goal is broken into a sequential PATH of milestones. The user works "the next step" and kills it. The CRM (companies, contacts, deals, tasks) hangs off those goals so business work and personal goals live in one place.

Your job is to help the user:
- Turn vague goals into a concrete goal with 3-6 ordered, specific milestones (use the create_goal tool — never just describe milestones, actually create them when the user wants a goal).
- Work their "kill list": call get_kill_list, then help them decide what to push, complete, archive, or kill. Be opinionated and direct about what to cut.
- Manage CRM records (companies, contacts, deals, tasks) and link goals to accounts so everything is connected.

Rules of engagement:
- Be conversational and collaborative. Think of yourself as a smart teammate, not an automation script.
- NEVER create, update, or delete anything without the user's explicit confirmation first. Propose what you plan to do and wait for a clear "yes", "go ahead", "do it", or equivalent before calling any mutating tool.
- When the user describes a goal or asks for help planning, outline your suggested milestones in plain text and ask "Want me to create this?" before touching any tool.
- When reading data (list_goals, get_kill_list, etc.) to answer a question, you can call those tools immediately — they don't change anything.
- After proposing an action, keep the ask short: one sentence ending with a yes/no question.
- Once the user confirms, execute cleanly and give a brief recap of what changed plus the single most valuable next step.
- If the user says something ambiguous, ask one focused clarifying question rather than guessing.
- Milestones must be concrete next actions (3-7 words each), ordered, and small enough to finish in days not months.
- Today's date is provided in the first user turn context. Use it for due dates and overdue logic.
- Never invent data you didn't retrieve via a tool.`;

interface ClientMessage {
  role: "user" | "assistant";
  content: string;
}

interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

export interface AgentResponse {
  reply: string;
  actions: string[];
  mutated: boolean;
}

// Gemini function declarations, converted from our tool registry.
const geminiTools = [
  {
    functionDeclarations: TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
    })),
  },
];

async function callGemini(contents: GeminiContent[]) {
  const url = `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents,
    tools: geminiTools,
    generationConfig: { maxOutputTokens: 1500 },
  });

  // Retry on 503 (overloaded) up to 2 extra attempts with short backoff.
  for (let attempt = 0; attempt <= 2; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, attempt * 1500));
    const res = await fetch(url, {
      method: "POST",
      signal: AbortSignal.timeout(45000),
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (res.ok) return res.json();
    const text = await res.text().catch(() => "");
    if (res.status === 503 && attempt < 2) continue;
    if (res.status === 503) throw new Error("The AI is busy right now — please try again in a moment.");
    if (res.status === 429) throw new Error("Rate limit reached — please wait a moment and try again.");
    throw new Error(`AI error (${res.status}) — please try again.`);
  }
}

/**
 * Run the agent loop: feed history + today's date, let Gemini call tools
 * against the user's data, and loop until it produces a final text reply.
 */
export async function runAgent(ctx: ToolContext, history: ClientMessage[]): Promise<AgentResponse> {
  const today = new Date().toISOString().slice(0, 10);

  // Convert client history to Gemini's content format.
  // Gemini uses "model" where Anthropic used "assistant".
  const contents: GeminiContent[] = history.map((m, i) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [
      {
        text: i === 0 && m.role === "user" ? `(Today is ${today}.)\n\n${m.content}` : m.content,
      },
    ],
  }));

  const actions: string[] = [];
  let mutated = false;

  for (let step = 0; step < MAX_STEPS; step++) {
    const data = await callGemini(contents);

    const candidate = data.candidates?.[0];
    if (!candidate) throw new Error("No candidate in Gemini response");

    const parts: GeminiPart[] = candidate.content?.parts ?? [];
    const finishReason: string = candidate.finishReason ?? "STOP";

    // Append model turn to history.
    contents.push({ role: "model", parts });

    const functionCalls = parts.filter((p) => p.functionCall);

    if (finishReason !== "FUNCTION_CALL" && functionCalls.length === 0) {
      const reply = parts
        .filter((p) => p.text)
        .map((p) => p.text!)
        .join("\n")
        .trim();
      return { reply: reply || "Done.", actions, mutated };
    }

    // Execute each function call and collect results.
    const responseParts: GeminiPart[] = [];
    for (const part of functionCalls) {
      const { name, args } = part.functionCall!;
      const tool = TOOLS_BY_NAME.get(name);
      if (!tool) {
        responseParts.push({
          functionResponse: { name, response: { error: `Unknown tool: ${name}` } },
        });
        continue;
      }
      try {
        const result = await tool.handler(ctx, args ?? {});
        if (result.error) {
          responseParts.push({ functionResponse: { name, response: { error: result.error } } });
        } else {
          if (tool.mutates) mutated = true;
          if (result.summary) actions.push(result.summary);
          responseParts.push({
            functionResponse: { name, response: { ok: true, ...result } },
          });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Tool failed";
        responseParts.push({ functionResponse: { name, response: { error: msg } } });
      }
    }

    contents.push({ role: "user", parts: responseParts });
  }

  return {
    reply: "I took several steps but stopped to avoid looping. Here's what I did — let me know how to continue.",
    actions,
    mutated,
  };
}
