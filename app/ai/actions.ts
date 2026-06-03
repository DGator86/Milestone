"use server";

export interface SuggestResult {
  milestones: string[];
  goal_type: string;
  importance: string;
  tip: string;
}

const KEYWORD_RULES: Array<{
  keywords: string[];
  milestones: string[];
  goal_type: string;
  importance: string;
  tip: string;
}> = [
  {
    keywords: ["launch", "ship", "release", "deploy", "publish", "feature", "product"],
    milestones: ["Research & spec", "Design", "Build", "Test & QA", "Ship"],
    goal_type: "deadline",
    importance: "important",
    tip: "Keep milestones small enough to complete in 1–2 weeks each.",
  },
  {
    keywords: ["deal", "sales", "client", "contract", "close", "prospect", "pitch"],
    milestones: ["Prospect & qualify", "Discovery call", "Demo", "Send proposal", "Negotiate & close"],
    goal_type: "deadline",
    importance: "critical",
    tip: "Set a concrete close date on each milestone to maintain urgency.",
  },
  {
    keywords: ["learn", "study", "course", "skill", "master", "understand", "read"],
    milestones: ["Set learning path", "Core fundamentals", "Practice project", "Apply in real work", "Teach or share"],
    goal_type: "concrete",
    importance: "normal",
    tip: "Spaced repetition and teaching others are the fastest paths to mastery.",
  },
  {
    keywords: ["hire", "recruit", "interview", "job", "team", "candidate", "onboard"],
    milestones: ["Define role & requirements", "Source candidates", "Screen & interview", "Select & offer", "Onboard"],
    goal_type: "deadline",
    importance: "important",
    tip: "Define your scorecard before you start reviewing resumes.",
  },
  {
    keywords: ["write", "blog", "article", "essay", "book", "newsletter", "content"],
    milestones: ["Outline & research", "First draft", "Edit & revise", "Final proofread", "Publish"],
    goal_type: "concrete",
    importance: "normal",
    tip: "Separate drafting from editing — don't edit while you write.",
  },
  {
    keywords: ["fitness", "gym", "run", "exercise", "workout", "health", "weight", "marathon", "5k", "10k"],
    milestones: ["Establish baseline", "Week 1–4 routine", "First milestone event", "Build the habit", "Level up"],
    goal_type: "maintenance",
    importance: "important",
    tip: "Consistency beats intensity. Show up every day even if briefly.",
  },
  {
    keywords: ["fundraise", "raise", "investor", "funding", "venture", "pitch deck", "seed"],
    milestones: ["Refine pitch deck", "Build target investor list", "First meetings", "Follow-ups & due diligence", "Close round"],
    goal_type: "deadline",
    importance: "critical",
    tip: "Warm intros convert 3–5× better than cold outreach.",
  },
  {
    keywords: ["design", "rebrand", "ui", "ux", "brand", "logo", "visual", "prototype"],
    milestones: ["Research & inspiration", "Concepts & direction", "Design iteration", "Stakeholder review", "Finalise & hand off"],
    goal_type: "concrete",
    importance: "normal",
    tip: "Get feedback early. A quick concept review saves weeks of rework.",
  },
  {
    keywords: ["move", "relocate", "apartment", "house", "rent", "buy", "home", "office"],
    milestones: ["Define requirements & budget", "Research & shortlist", "View & evaluate", "Negotiate & commit", "Move & settle"],
    goal_type: "deadline",
    importance: "important",
    tip: "Build in buffer time — property timelines almost always slip.",
  },
];

function fallbackSuggest(description: string): SuggestResult {
  const lower = description.toLowerCase();

  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return {
        milestones: rule.milestones,
        goal_type: rule.goal_type,
        importance: rule.importance,
        tip: rule.tip,
      };
    }
  }

  return {
    milestones: ["Research & plan", "First step", "Build momentum", "Reach halfway", "Complete"],
    goal_type: "concrete",
    importance: "normal",
    tip: "Break any goal into the smallest possible next action to get started.",
  };
}

async function callClaude(description: string): Promise<SuggestResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("No API key");

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal: AbortSignal.timeout(15000),
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `You are a goal planning assistant. Given a goal description, suggest 4–6 clear, actionable milestone titles.

Goal: "${description}"

Reply with ONLY valid JSON in this exact shape (no markdown, no explanation):
{
  "milestones": ["step 1", "step 2", "step 3", "step 4", "step 5"],
  "goal_type": "concrete" | "deadline" | "maintenance" | "touches",
  "importance": "normal" | "important" | "critical",
  "tip": "one sentence of advice"
}`,
        },
      ],
    }),
  });

  if (!resp.ok) throw new Error("API error");

  const data = await resp.json();
  const text = data.content?.[0]?.text ?? "";

  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed?.milestones) || !parsed?.goal_type) {
    throw new Error("Invalid response shape");
  }
  return parsed as SuggestResult;
}

export async function suggestMilestones(formData: FormData): Promise<SuggestResult> {
  const description = (formData.get("description") as string)?.trim();
  if (!description) {
    return fallbackSuggest("");
  }

  try {
    return await callClaude(description);
  } catch {
    return fallbackSuggest(description);
  }
}
