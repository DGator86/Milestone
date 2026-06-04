"use client";

import { useState, useEffect } from "react";
import CriticalPaths from "@/components/home/CriticalPaths";
import CreateGoalForm from "@/components/forms/CreateGoalForm";
import KillList from "@/components/home/KillList";
import GoalWizard from "@/components/dashboard/GoalWizard";
import type { GoalWithDetails, Group, CrmTask, CrmCustomer } from "@/lib/types";

const WIZARD_KEY = "wizard_dismissed";

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
  const [prefill, setPrefill] = useState<{ title?: string; goal_type?: string; milestones?: string[] } | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("goal_prefill");
      if (raw) {
        const data = JSON.parse(raw);
        setPrefill(data);
        sessionStorage.removeItem("goal_prefill");
        setWizardOpen(true);
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
      <div className="p-3 md:p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            <CriticalPaths goals={goals} onNewGoal={openWizard} />
            <CreateGoalForm groups={groups} />
          </div>
          <div className="lg:col-span-1">
            <KillList goals={goals} tasks={tasks} customers={customers} />
          </div>
        </div>
      </div>
    </>
  );
}
