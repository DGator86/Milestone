import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ollamaChat, ollamaConfigured, OLLAMA_MODEL } from "@/lib/ollama";

const TYPE_LABELS: Record<string, string> = {
  concrete: "Project (defined goal with a clear finish line)",
  touches: "Habit (regular recurring activity)",
  deadline: "Deadline (must be done by a specific date)",
  maintenance: "Ongoing (continuous, no end date)",
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!ollamaConfigured()) {
    return NextResponse.json({ error: "OLLAMA_BASE_URL not configured" }, { status: 503 });
  }

  const { title, goal_type } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "title required" }, { status: 400 });

  const typeLabel = TYPE_LABELS[goal_type] ?? "Project";

  try {
    const text = await ollamaChat(
      [
        {
          role: "system",
          content:
            `You are a goal-setting assistant using model ${OLLAMA_MODEL}. ` +
            "Return ONLY a valid JSON array of exactly 4 short action phrases (3-7 words each). No markdown, no explanation.",
        },
        {
          role: "user",
          content: `Goal: "${title.trim()}"\nType: ${typeLabel}\n\nReturn a JSON array of 4 sequential milestone steps, e.g.:\n["Research and define scope","Complete first draft","Review and revise","Finalize and deliver"]`,
        },
      ],
      true,
    );

    const match = text.match(/\[[\s\S]*?\]/);
    const raw = match ? match[0] : text;
    const arr = JSON.parse(raw);

    if (!Array.isArray(arr)) throw new Error("not an array");
    return NextResponse.json({ milestones: arr.slice(0, 6) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
