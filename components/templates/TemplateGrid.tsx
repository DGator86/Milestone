"use client";

import { useRouter } from "next/navigation";
import { Briefcase, Heart, Home, ChevronRight } from "lucide-react";

interface Template {
  id: string;
  title: string;
  description: string;
  goal_type: string;
  milestones: string[];
  category: "Work" | "Health" | "Home";
  emoji: string;
}

const TEMPLATES: Template[] = [
  {
    id: "launch-product",
    title: "Launch a Product",
    description: "Take an idea from concept to live launch with structured milestones.",
    goal_type: "concrete",
    milestones: ["Market research", "Define MVP", "Build prototype", "Beta launch", "Full launch"],
    category: "Work",
    emoji: "🚀",
  },
  {
    id: "close-deal",
    title: "Close a Sales Deal",
    description: "Move a prospect through the full sales cycle to a signed contract.",
    goal_type: "deadline",
    milestones: ["Initial outreach", "Discovery call", "Send proposal", "Negotiate terms", "Close & onboard"],
    category: "Work",
    emoji: "🤝",
  },
  {
    id: "learn-skill",
    title: "Learn a New Skill",
    description: "Go from zero to confident with a structured learning path.",
    goal_type: "concrete",
    milestones: ["Find resources", "Complete basics", "Build a practice project", "Get peer feedback", "Achieve proficiency"],
    category: "Work",
    emoji: "📚",
  },
  {
    id: "run-5k",
    title: "Run a 5K",
    description: "Train from couch to completing your first 5K race.",
    goal_type: "deadline",
    milestones: ["Week 1: start running plan", "Run 1 mile non-stop", "Run 2 miles", "Complete 3 mile run", "Race day"],
    category: "Health",
    emoji: "🏃",
  },
  {
    id: "build-habit",
    title: "Build a Daily Habit",
    description: "Establish a new routine and make it stick over 30 days.",
    goal_type: "maintenance",
    milestones: ["Week 1: build the streak", "Week 2: stay consistent", "Week 3: reinforce the habit", "Week 4: it's automatic"],
    category: "Health",
    emoji: "⚡",
  },
  {
    id: "home-project",
    title: "Home Renovation",
    description: "Plan and execute a home improvement project from start to finish.",
    goal_type: "concrete",
    milestones: ["Plan & set budget", "Get quotes", "Order materials", "Complete the work", "Final touch-up & clean"],
    category: "Home",
    emoji: "🏠",
  },
];

const CATEGORY_ICONS = {
  Work: Briefcase,
  Health: Heart,
  Home: Home,
};

const CATEGORY_COLORS = {
  Work: "text-milestone-blue bg-milestone-blue-dim",
  Health: "text-milestone-red bg-milestone-red-dim",
  Home: "text-milestone-green bg-milestone-green-dim",
};

export default function TemplateGrid() {
  const router = useRouter();

  function handleSelect(template: Template) {
    sessionStorage.setItem(
      "goal_prefill",
      JSON.stringify({
        title: template.title,
        goal_type: template.goal_type,
        milestones: template.milestones,
      })
    );
    router.push("/dashboard#create-goal");
  }

  const categories = ["Work", "Health", "Home"] as const;

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">Templates</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Pick a template to pre-fill your new goal — edit anything before creating.
        </p>
      </div>

      {categories.map((cat) => {
        const Icon = CATEGORY_ICONS[cat];
        const colorCls = CATEGORY_COLORS[cat];
        const items = TEMPLATES.filter((t) => t.category === cat);

        return (
          <div key={cat} className="mb-8">
            <div className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3 ${colorCls}`}>
              <Icon size={12} />
              {cat}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {items.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelect(template)}
                  className="bg-white border border-milestone-line rounded-xl p-4 text-left hover:border-milestone-blue hover:shadow-md transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">{template.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-bold text-gray-900 group-hover:text-milestone-blue transition-colors">
                          {template.title}
                        </p>
                        <ChevronRight size={14} className="text-gray-200 group-hover:text-milestone-blue transition-colors shrink-0" />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{template.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {template.milestones.slice(0, 3).map((m) => (
                          <span
                            key={m}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium"
                          >
                            {m}
                          </span>
                        ))}
                        {template.milestones.length > 3 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                            +{template.milestones.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
