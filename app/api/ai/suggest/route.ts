import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TYPE_LABELS: Record<string, string> = {
  concrete: "Project (defined goal with a clear finish line)",
  touches: "Habit (regular recurring activity)",
  deadline: "Deadline (must be done by a specific date)",
  maintenance: "Ongoing (continuous, no end date)",
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  const { title, goal_type } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "title required" }, { status: 400 });

  const client = new Anthropic();
  const typeLabel = TYPE_LABELS[goal_type] ?? "Project";

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `Goal: "${title.trim()}"
Type: ${typeLabel}

Suggest exactly 4 clear, sequential milestone steps to achieve this goal. Each should be a short action phrase (3-7 words). Return ONLY a valid JSON array of 4 strings with no other text.

Example format: ["Research and define scope","Complete first draft","Review and revise","Finalize and deliver"]`,
      },
    ],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";

  try {
    const arr = JSON.parse(text);
    if (Array.isArray(arr)) return NextResponse.json({ milestones: arr.slice(0, 6) });
  } catch {
    const match = text.match(/\[[\s\S]*?\]/);
    if (match) {
      const arr = JSON.parse(match[0]);
      return NextResponse.json({ milestones: arr.slice(0, 6) });
    }
  }

  return NextResponse.json({ error: "Could not parse suggestions" }, { status: 500 });
}
