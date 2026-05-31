"use client";

import { useState, useTransition } from "react";
import { Workflow, Plus, X, Trash2, GitBranch } from "lucide-react";
import type { CrmFlow } from "@/lib/types";
import { createFlow, deleteFlow } from "@/app/flows/actions";

const PRESET_COLORS = [
  { label: "Blue", value: "#1769FF" },
  { label: "Green", value: "#36A852" },
  { label: "Amber", value: "#F8B400" },
  { label: "Red", value: "#EA4335" },
  { label: "Purple", value: "#8B5CF6" },
  { label: "Teal", value: "#0D9488" },
  { label: "Orange", value: "#F97316" },
  { label: "Pink", value: "#EC4899" },
];

const DEFAULT_STAGES_TEXT = "Lead\nQualified\nProposal\nNegotiation\nClosed Won";

const INPUT =
  "w-full px-3 py-2 text-sm border border-milestone-line rounded-lg focus:outline-none focus:ring-2 focus:ring-milestone-blue/20 focus:border-milestone-blue bg-white";

const LABEL = "block text-xs font-medium text-gray-500 mb-1";

interface Props {
  flows: CrmFlow[];
  oppCountByFlow: Record<string, number>;
}

function FlowCard({
  flow,
  oppCount,
  onDelete,
}: {
  flow: CrmFlow;
  oppCount: number;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-card border border-milestone-line overflow-hidden group">
      {/* Colored top bar */}
      <div className="h-1.5" style={{ backgroundColor: flow.color }} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${flow.color}18` }}
            >
              <GitBranch size={17} style={{ color: flow.color }} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 truncate">{flow.name}</p>
              {flow.description && (
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{flow.description}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => onDelete(flow.id)}
            className="text-gray-200 hover:text-milestone-red transition-colors opacity-0 group-hover:opacity-100 shrink-0 mt-1"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Stages */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {flow.stages.map((stage, i) => (
            <span
              key={i}
              className="text-[11px] font-medium px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${flow.color}18`,
                color: flow.color,
              }}
            >
              {stage}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3.5 border-t border-milestone-line flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {flow.stages.length} stages
          </span>
          <span className="text-xs font-semibold text-gray-500">
            {oppCount} {oppCount === 1 ? "opportunity" : "opportunities"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function FlowsView({ flows, oppCountByFlow }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0].value);
  const [isPending, startTransition] = useTransition();

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("color", selectedColor);
    startTransition(async () => {
      await createFlow(formData);
      setShowForm(false);
      setSelectedColor(PRESET_COLORS[0].value);
    });
  }

  function handleDelete(id: string) {
    startTransition(() => deleteFlow(id));
  }

  return (
    <div className="p-6 max-w-6xl" style={{ opacity: isPending ? 0.7 : 1 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Workflow size={20} className="text-milestone-blue" />
            Flows
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {flows.length} {flows.length === 1 ? "pipeline" : "pipelines"} · Define custom deal stages per sales motion
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-milestone-blue text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? "Cancel" : "Create Flow"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-card border border-milestone-line p-5 mb-6 animate-fade-up">
          <p className="text-sm font-bold text-gray-900 mb-4">New Flow</p>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Flow Name *</label>
                <input name="name" required placeholder="Enterprise Sales" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Description</label>
                <input name="description" placeholder="For deals over $50k" className={INPUT} />
              </div>
            </div>

            {/* Color picker */}
            <div className="mt-4">
              <label className={LABEL}>Color</label>
              <div className="flex gap-2 flex-wrap mt-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setSelectedColor(c.value)}
                    title={c.label}
                    className="w-7 h-7 rounded-full transition-transform hover:scale-110 ring-offset-2"
                    style={{
                      backgroundColor: c.value,
                      outline: selectedColor === c.value ? `2px solid ${c.value}` : "none",
                      outlineOffset: "2px",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Stages */}
            <div className="mt-4">
              <label className={LABEL}>Stages (one per line)</label>
              <textarea
                name="stages"
                rows={5}
                defaultValue={DEFAULT_STAGES_TEXT}
                placeholder="Lead&#10;Qualified&#10;Proposal&#10;Negotiation&#10;Closed Won"
                className={INPUT}
              />
              <p className="text-[11px] text-gray-400 mt-1">Each line becomes a stage in the pipeline.</p>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 bg-milestone-blue text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Save Flow
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Flows grid */}
      {flows.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card border border-milestone-line p-14 text-center">
          <Workflow size={36} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm font-medium text-gray-400">No flows yet.</p>
          <p className="text-xs text-gray-300 mt-1">
            Create a flow to define custom pipeline stages for your opportunities.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {flows.map((flow) => (
            <FlowCard
              key={flow.id}
              flow={flow}
              oppCount={oppCountByFlow[flow.id] ?? 0}
              onDelete={handleDelete}
            />
          ))}

          {/* Add placeholder */}
          <button
            onClick={() => setShowForm(true)}
            className="rounded-xl border-2 border-dashed border-milestone-line p-8 flex flex-col items-center justify-center gap-3 text-gray-300 hover:border-milestone-blue hover:text-milestone-blue transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl border-2 border-dashed border-current flex items-center justify-center group-hover:bg-milestone-blue-dim">
              <Plus size={18} />
            </div>
            <p className="text-sm font-semibold">Create a flow</p>
          </button>
        </div>
      )}
    </div>
  );
}
