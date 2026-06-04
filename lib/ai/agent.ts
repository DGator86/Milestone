import { TOOLS, TOOLS_BY_NAME, type ToolContext } from "./tools";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
const MAX_STEPS = 6;

export function agentConfigured() {
  return !!process.env.ANTHROPIC_API_KEY;
}

const SYSTEM_PROMPT = `You are Milestone's built-in assistant — a sharp, no-nonsense operator embedded in a goal-centric CRM.

Milestone's core idea: every goal is broken into a sequential PATH of milestones. The user works "the next step" and kills it. The CRM (companies, contacts, deals, tasks) hangs off those goals so business work and personal goals live in one place.

Your job is to help the user:
- Turn vague goals into a concrete goal with 3-6 ordered, specific milestones (use the create_goal tool — never just describe milestones, actually create them when the user wants a goal).
- Work their "kill list": call get_kill_list, then help them decide what to push, complete, archive, or kill. Be opinionated and direct about what to cut.
- Manage CRM records (companies, contacts, deals, tasks) and link goals to accounts so everything is connected.

Rules of engagement:
- Be concise and action-oriented. Prefer doing over explaining.
- When the user clearly wants something created or changed, USE THE TOOLS rather than asking for permission for every detail — infer sensible defaults (goal_type "concrete", importance "normal") and tell them what you did. You can always adjust after.
- Only ask a clarifying question when you genuinely cannot proceed (e.g. truly ambiguous which goal they mean and no fuzzy match works).
- Milestones must be concrete next actions (3-7 words each), ordered, and small enough to finish in days, not months.
- After taking actions, give a brief recap of what changed and suggest the single most valuable next step.
- Today's date is provided in the first user turn context. Use it for due dates and overdue logic.
- Never invent data you didn't retrieve via a tool. If you need the user's current goals/companies, call the relevant list tool first.`;

interface ClientMessage {
  role: "user" | "assistant";
  content: string;
}

type Block =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean };

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string | Block[];
}

export interface AgentResponse {
  reply: string;
  actions: string[];
  mutated: boolean;
}

const anthropicTools = TOOLS.map((t, i) => ({
  name: t.name,
  description: t.description,
  input_schema: t.input_schema,
  // Cache the (static) tool list so repeat turns are cheap.
  ...(i === TOOLS.length - 1 ? { cache_control: { type: "ephemeral" as const } } : {}),
}));

async function callAnthropic(messages: AnthropicMessage[]) {
  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    signal: AbortSignal.timeout(45000),
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY as string,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      tools: anthropicTools,
      messages,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Anthropic ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

/**
 * Run the agent loop: feed history + today's date, let Claude call tools against
 * the user's data, and loop until it produces a final text reply.
 */
export async function runAgent(ctx: ToolContext, history: ClientMessage[]): Promise<AgentResponse> {
  const today = new Date().toISOString().slice(0, 10);
  const messages: AnthropicMessage[] = history.map((m, i) => {
    if (i === 0 && m.role === "user") {
      return { role: "user", content: `(Today is ${today}.)\n\n${m.content}` };
    }
    return { role: m.role, content: m.content };
  });

  const actions: string[] = [];
  let mutated = false;

  for (let step = 0; step < MAX_STEPS; step++) {
    const data = await callAnthropic(messages);
    const blocks: Block[] = data.content ?? [];
    messages.push({ role: "assistant", content: blocks });

    const toolUses = blocks.filter((b): b is Extract<Block, { type: "tool_use" }> => b.type === "tool_use");

    if (data.stop_reason !== "tool_use" || toolUses.length === 0) {
      const reply = blocks
        .filter((b): b is Extract<Block, { type: "text" }> => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      return { reply: reply || "Done.", actions, mutated };
    }

    const results: Block[] = [];
    for (const use of toolUses) {
      const tool = TOOLS_BY_NAME.get(use.name);
      if (!tool) {
        results.push({ type: "tool_result", tool_use_id: use.id, content: `Unknown tool: ${use.name}`, is_error: true });
        continue;
      }
      try {
        const result = await tool.handler(ctx, use.input ?? {});
        if (result.error) {
          results.push({ type: "tool_result", tool_use_id: use.id, content: result.error, is_error: true });
        } else {
          if (tool.mutates) mutated = true;
          if (result.summary) actions.push(result.summary);
          results.push({ type: "tool_result", tool_use_id: use.id, content: JSON.stringify({ ok: true, ...result }) });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Tool failed";
        results.push({ type: "tool_result", tool_use_id: use.id, content: msg, is_error: true });
      }
    }
    messages.push({ role: "user", content: results });
  }

  return {
    reply: "I took several steps but stopped to avoid looping. Here's what I did — let me know how to continue.",
    actions,
    mutated,
  };
}
