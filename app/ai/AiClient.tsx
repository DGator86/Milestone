"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bot, Sparkles, ArrowRight, RotateCcw, Lightbulb } from "lucide-react";
import { suggestMilestones } from "./actions";
import type { SuggestResult } from "./actions";

const EXAMPLES = [
  "Close the Acme enterprise deal",
  "Launch our new mobile app",
  "Learn TypeScript properly",
  "Run my first marathon",
  "Write and publish a blog post",
];

const IMPORTANCE_COLORS: Record<string, string> = {
  critical: "bg-milestone-red-dim text-milestone-red",
  important: "bg-milestone-amber-dim text-milestone-amber",
  normal: "bg-gray-100 text-gray-500",
};

const TYPE_LABELS: Record<string, string> = {
  concrete: "Concrete",
  deadline: "Deadline",
  maintenance: "Maintenance",
  touches: "Touches",
};

export default function AiClient() {
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<SuggestResult | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("description", description);
      const res = await suggestMilestones(fd);
      setResult(res);
    });
  }

  function handleUseTemplate() {
    if (!result) return;
    const params = new URLSearchParams();
    params.set("ms", result.milestones.join("|"));
    params.set("gt", result.goal_type);
    params.set("imp", result.importance);
    router.push(`/dashboard?${params.toString()}#create-goal`);
  }

  return (
    <div className="max-w-2xl">
      {/* Input card */}
      <div className="bg-white rounded-xl shadow-card border border-milestone-line p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
            <Sparkles size={18} className="text-milestone-blue" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Milestone Suggester</p>
            <p className="text-xs text-gray-400">Describe your goal — get a ready-made milestone plan</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Close the Acme enterprise deal by end of Q2…"
              rows={3}
              className="w-full px-4 py-3 border border-milestone-line rounded-lg text-sm font-medium resize-none placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-milestone-blue transition-all"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setDescription(ex)}
                  className="text-[11px] font-medium px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full hover:bg-milestone-blue-dim hover:text-milestone-blue transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={pending || !description.trim()}
            className="flex items-center gap-2 bg-milestone-blue text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {pending ? (
              <>
                <RotateCcw size={15} className="animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Bot size={15} />
                Suggest Milestones
              </>
            )}
          </button>
        </form>
      </div>

      {/* Result card */}
      {result && (
        <div className="bg-white rounded-xl shadow-card border border-milestone-line overflow-hidden animate-fade-up">
          <div className="px-6 py-4 border-b border-milestone-line bg-gray-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-gray-900">Suggested Milestones</p>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded capitalize ${
                  IMPORTANCE_COLORS[result.importance] ?? IMPORTANCE_COLORS.normal
                }`}
              >
                {result.importance}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 capitalize">
                {TYPE_LABELS[result.goal_type] ?? result.goal_type}
              </span>
            </div>
            <button
              onClick={() => setResult(null)}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Clear
            </button>
          </div>

          <div className="divide-y divide-milestone-line">
            {result.milestones.map((ms, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-3.5">
                <div className="w-6 h-6 rounded-full bg-milestone-blue-dim flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-bold text-milestone-blue">{i + 1}</span>
                </div>
                <p className="text-sm font-medium text-gray-800">{ms}</p>
              </div>
            ))}
          </div>

          {result.tip && (
            <div className="px-6 py-4 bg-amber-50 border-t border-milestone-line flex items-start gap-3">
              <Lightbulb size={15} className="text-milestone-amber shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 font-medium leading-relaxed">{result.tip}</p>
            </div>
          )}

          <div className="px-6 py-4 border-t border-milestone-line flex gap-2.5">
            <button
              onClick={handleUseTemplate}
              className="flex items-center gap-1.5 bg-milestone-blue text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
            >
              Use these milestones
              <ArrowRight size={14} />
            </button>
            <button
              onClick={() => {
                const text = result.milestones.map((m, i) => `${i + 1}. ${m}`).join("\n");
                navigator.clipboard.writeText(text);
              }}
              className="px-4 py-2.5 text-sm font-semibold bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Copy to clipboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
