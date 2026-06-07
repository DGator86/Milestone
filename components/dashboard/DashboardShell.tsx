"use client";

import { useState, useEffect } from "react";
import CriticalPaths from "@/components/home/CriticalPaths";
import FocusToday from "@/components/home/FocusToday";
import AgendaView from "@/components/home/AgendaView";
import CalendarView from "@/components/home/CalendarView";
import KillList from "@/components/home/KillList";
import GoalWizard from "@/components/dashboard/GoalWizard";
import type { GoalWithDetails, Group, CrmTask, CrmCustomer } from "@/lib/types";

const WIZARD_KEY = "wizard_dismissed";

type ViewTab = "focus" | "agenda" | "calendar";
type GoalPrefill = { title?: string; goal_type?: string; milestones?: string[] };

function isGoalPrefill(v: unknown): v is GoalPrefill {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    (o.title === undefined || typeof o.title === "string") &&
    (o.goal_type === undefined || typeof o.goal_type === "string") &&
    (o.milestones === undefined ||
      (Array.isArray(o.milestones) && o.milestones.every((m) => typeof m === "string")))
  );
}

const TABS: { key: ViewTab; label: string }[] = [
  { key: "focus", label: "Today" },
  { key: "agenda", label: "Agenda" },
  { key: "calendar", label: "Calendar" },
];

export default function DashboardShell({
  goals,
  groups,
  tasks,
  customers,
}: {
  goals: GoalWithDetails[];
  groups: Group[];
  tasks: CrmTask[];
  customers: Pick<CrmCustomer, "id" | "name">[];
}) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [prefill, setPrefill] = useState<GoalPrefill | null>(null);
  const [view, setView] = useState<ViewTab>("focus");

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("goal_prefill");
      if (raw) {
        const data: unknown = JSON.parse(raw);
        sessionStorage.removeItem("goal_prefill");
        if (isGoalPrefill(data)) {
          setPrefill(data);
          setWizardOpen(true);
        }
        return;
      }
    } catch {}
    if (goals.length === 0 && !localStorage.getItem(WIZARD_KEY)) {
      setWizardOpen(true);
    }
  }, [goals.length]);

  function openWizard() {
    setPrefill(null);
    setWizardOpen(true);
  }

  function closeWizard() {
    localStorage.setItem(WIZARD_KEY, "1");
    setWizardOpen(false);
  }

  return (
    <>
      <GoalWizard groups={groups} open={wizardOpen} onClose={closeWizard} prefill={prefill} />
      <div className="p-3 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6">

        {/* ── View tab switcher ── */}
        <div className="flex bg-white dark:bg-[#0B1929] rounded-xl border border-milestone-line dark:border-white/[0.08] p-1 gap-1 shadow-card">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                view === key
                  ? "bg-milestone-blue text-white shadow-sm"
                  : "text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Today: focus queue + goal paths + task list ── */}
        {view === "focus" && (
          <>
            <FocusToday goals={goals} onNewGoal={openWizard} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="lg:col-span-2">
                <CriticalPaths goals={goals} onNewGoal={openWizard} />
              </div>
              <div className="lg:col-span-1">
                <KillList goals={goals} tasks={tasks} customers={customers} />
              </div>
            </div>
          </>
        )}

        {/* ── Agenda: all milestones grouped by due date ── */}
        {view === "agenda" && <AgendaView goals={goals} />}

        {/* ── Calendar: month grid with milestone dots ── */}
        {view === "calendar" && <CalendarView goals={goals} />}

      </div>
    </>
  );
}
