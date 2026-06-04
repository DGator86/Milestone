"use client";

import { useState, useTransition } from "react";
import { Workflow, Plus, X, Trash2, GitBranch, ChevronRight } from "lucide-react";
import type { CrmFlow, CrmFlowInstance, CrmCustomer } from "@/lib/types";
import { createFlow, deleteFlow, createFlowInstance, advanceFlowInstance, deleteFlowInstance } from "@/app/flows/actions";

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

const DEFAULT_STAGES_TEXT = "Lead\nQualified\nProposal\nNegotiation\nWon\nLost";

const INPUT =
  "w-full px-3 py-2 text-sm border border-milestone-line rounded-lg focus:outline-none focus:ring-2 focus:ring-milestone-blue/20 focus:border-milestone-blue bg-white";

const LABEL = "block text-xs font-medium text-gray-500 mb-1";

interface Props {
  flows: CrmFlow[];
  oppCountByFlow: Record<string, number>;
  instances: CrmFlowInstance[];
  customers: Pick<CrmCustomer, "id" | "name">[];
}

function InstanceRow({
  instance,
  onAdvance,
  onDelete,
}: {
  instance: CrmFlowInstance;
  onAdvance: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const flow = instance.crm_flows;
  const stageName = flow ? (flow.stages[instance.current_stage_idx] ?? flow.stages[0]) : "—";
  const color = flow?.color ?? "#1769FF";

  return (
    <div className="group flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50/60 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {instance.crm_customers?.name ?? "Unassigned"}
        </p>
        {instance.run_count > 1 && (
          <p className="text-[11px] text-gray-400">Cycle #{instance.run_count}</p>
        )}
      </div>
      <span
        className="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0"
        style={{ backgroundColor: `${color}18`, color }}
      >
        {stageName}
      </span>
      <button
        onClick={() => onAdvance(instance.id)}
        className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-milestone-blue transition-colors shrink-0"
      >
        <ChevronRight size={13} />
        Advance
      </button>
      <button
        onClick={() => onDelete(instance.id)}
        className="text-gray-200 hover:text-milestone-red transition-colors opacity-0 group-hover:opacity-100 shrink-0"
        aria-label="Remove instance"
      >
        <X size={13} />
      </button>
    </div>
  );
}

function AssignForm({
  flowId,
  customers,
  onSubmit,
}: {
  flowId: string;
  customers: Pick<CrmCustomer, "id" | "name">[];
  onSubmit: (flowId: string, customerId: string | null) => void;
}) {
  const [customerId, setCustomerId] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(flowId, customerId || null);
    setCustomerId("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-2 border-t border-milestone-line/50">
      <select
        value={customerId}
        onChange={(e) => setCustomerId(e.target.value)}
        className="flex-1 px-2.5 py-1.5 text-xs border border-milestone-line rounded-lg focus:outline-none focus:ring-1 focus:ring-milestone-blue focus:border-milestone-blue bg-white text-gray-700"
      >
        <option value="">Unassigned</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <button
        type="submit"
        className="px-3 py-1.5 bg-milestone-blue text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors shrink-0"
      >
        Assign
      </button>
    </form>
  );
}

export default function FlowsView({ flows, oppCountByFlow, instances, customers }: Props) {
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

  function handleDeleteFlow(id: string) {
    startTransition(() => deleteFlow(id));
  }

  function handleCreateInstance(flowId: string, customerId: string | null) {
    startTransition(() => createFlowInstance(flowId, customerId));
  }

  function handleAdvance(instanceId: string) {
    startTransition(() => advanceFlowInstance(instanceId));
  }

  function handleDeleteInstance(instanceId: string) {
    startTransition(() => deleteFlowInstance(instanceId));
  }

  const flowsWithInstances = flows.filter((f) => instances.some((i) => i.flow_id === f.id));
  const flowsWithoutInstances = flows.filter((f) => !instances.some((i) => i.flow_id === f.id));

  return (
    <div className="p-6 max-w-6xl" style={{ opacity: isPending ? 0.7 : 1 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Workflow size={20} className="text-milestone-blue" />
            Flows
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {flows.length} {flows.length === 1 ? "pipeline" : "pipelines"} · Track active deals through each stage
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

            <div className="mt-4">
              <label className={LABEL}>Stages (one per line)</label>
              <textarea
                name="stages"
                rows={5}
                defaultValue={DEFAULT_STAGES_TEXT}
                placeholder="Lead&#10;Qualified&#10;Proposal&#10;Negotiation&#10;Won&#10;Lost"
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

      {instances.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Active Flows</h2>
          <div className="space-y-3">
            {flowsWithInstances.map((flow) => {
              const flowInstances = instances.filter((i) => i.flow_id === flow.id);
              return (
                <div key={flow.id} className="bg-white rounded-xl shadow-card border border-milestone-line overflow-hidden">
                  <div className="h-1" style={{ backgroundColor: flow.color }} />
                  <div className="px-4 py-3 border-b border-milestone-line/60 flex items-center gap-2.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: flow.color }}
                    />
                    <p className="text-sm font-bold text-gray-900">{flow.name}</p>
                    <span className="text-[11px] text-gray-400 ml-auto">{flow.stages.length} stages</span>
                  </div>
                  <div className="divide-y divide-milestone-line/60">
                    {flowInstances.map((instance) => (
                      <InstanceRow
                        key={instance.id}
                        instance={instance}
                        onAdvance={handleAdvance}
                        onDelete={handleDeleteInstance}
                      />
                    ))}
                  </div>
                  <AssignForm flowId={flow.id} customers={customers} onSubmit={handleCreateInstance} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Flow Templates</h2>
        {flows.length === 0 ? (
          <div className="bg-white rounded-xl shadow-card border border-milestone-line p-14 text-center">
            <Workflow size={36} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-400">No flows yet.</p>
            <p className="text-xs text-gray-300 mt-1">
              Create a flow to define custom pipeline stages for your opportunities.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-card border border-milestone-line overflow-hidden divide-y divide-milestone-line">
            {flows.map((flow) => (
              <div key={flow.id} className="group flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${flow.color}18` }}
                >
                  <GitBranch size={15} style={{ color: flow.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{flow.name}</p>
                  <p className="text-[11px] text-gray-400">{flow.stages.length} stages · {oppCountByFlow[flow.id] ?? 0} opportunities</p>
                </div>
                <div className="flex flex-wrap gap-1 shrink-0 max-w-[200px] hidden sm:flex">
                  {flow.stages.slice(0, 4).map((stage, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: `${flow.color}18`, color: flow.color }}
                    >
                      {stage}
                    </span>
                  ))}
                  {flow.stages.length > 4 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">
                      +{flow.stages.length - 4}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleCreateInstance(flow.id, null)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-milestone-blue hover:bg-milestone-blue-dim px-2 py-1 rounded-lg transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                >
                  <Plus size={11} />
                  Start
                </button>
                <button
                  onClick={() => handleDeleteFlow(flow.id)}
                  className="text-gray-200 hover:text-milestone-red transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                  aria-label="Delete flow"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 w-full px-4 py-3 text-gray-300 hover:text-milestone-blue hover:bg-gray-50/50 transition-colors text-sm font-semibold"
            >
              <Plus size={15} />
              Create a flow
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
