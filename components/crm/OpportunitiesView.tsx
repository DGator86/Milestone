"use client";

import { useState, useTransition, useMemo, useRef, useEffect } from "react";
import { TrendingUp, Plus, X, ChevronRight, Trash2, DollarSign } from "lucide-react";
import type { CrmOpportunity, CrmCustomer, CrmContact, CrmFlow } from "@/lib/types";
import {
  createOpportunity,
  deleteOpportunity,
  moveOpportunity,
} from "@/app/opportunities/actions";

const DEFAULT_STAGES = ["Lead", "Qualified", "Proposal", "Negotiation", "Won", "Lost"];

const STAGE_COLORS: Record<string, string> = {
  Won: "bg-milestone-green-dim border-milestone-green/20",
  Lost: "bg-milestone-red-dim border-milestone-red/20",
};

const STAGE_HEADER: Record<string, string> = {
  Won: "text-milestone-green",
  Lost: "text-milestone-red",
};

const INPUT =
  "w-full px-3 py-2 text-sm border border-milestone-line rounded-lg focus:outline-none focus:ring-2 focus:ring-milestone-blue/20 focus:border-milestone-blue bg-white";

const LABEL = "block text-xs font-medium text-gray-500 mb-1";

interface Props {
  opportunities: CrmOpportunity[];
  customers: Pick<CrmCustomer, "id" | "name">[];
  contacts: Pick<CrmContact, "id" | "first_name" | "last_name">[];
  flows: Pick<CrmFlow, "id" | "name" | "stages">[];
}

function fmt(v: number | null) {
  if (v == null) return null;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v.toLocaleString()}`;
}

function OppCard({
  opp,
  stages,
  isMismatched,
  onMove,
  onDelete,
}: {
  opp: CrmOpportunity;
  stages: string[];
  isMismatched: boolean;
  onMove: (id: string, stage: string) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const otherStages = stages.filter((s) => s !== opp.stage);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="bg-white rounded-xl shadow-card border border-milestone-line p-3.5 group">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-gray-900 text-[13px] leading-snug flex-1">{opp.title}</p>
        <button
          onClick={() => onDelete(opp.id)}
          className="text-gray-200 hover:text-milestone-red transition-colors opacity-0 group-hover:opacity-100 shrink-0 mt-0.5"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {opp.crm_customers && (
        <p className="text-xs text-gray-400 mt-1">{opp.crm_customers.name}</p>
      )}
      {isMismatched && (
        <p className="text-[10px] text-milestone-amber bg-milestone-amber-dim px-1.5 py-0.5 rounded mt-1 inline-block">
          Stage: {opp.stage}
        </p>
      )}

      <div className="flex items-center justify-between mt-2.5">
        {opp.value != null ? (
          <span className="text-sm font-bold text-milestone-blue">{fmt(opp.value)}</span>
        ) : (
          <span className="text-xs text-gray-300 flex items-center gap-0.5">
            <DollarSign size={11} />—
          </span>
        )}
        {opp.close_date && (
          <span className="text-[11px] text-gray-400">
            {(() => {
              const [y, m, d] = opp.close_date.split("-").map(Number);
              return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
            })()}
          </span>
        )}
      </div>

      {/* Move stage */}
      {otherStages.length > 0 && (
        <div ref={dropdownRef} className="relative mt-2.5 pt-2.5 border-t border-milestone-line">
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-[11px] text-gray-400 hover:text-milestone-blue transition-colors flex items-center gap-0.5"
          >
            Move stage <ChevronRight size={11} />
          </button>
          {open && (
            <div className="absolute top-full mt-1 left-0 bg-white rounded-lg shadow-card-lg border border-milestone-line p-1 z-20 min-w-[130px]">
              {otherStages.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    onMove(opp.id, s);
                    setOpen(false);
                  }}
                  className="block w-full text-left text-[12px] px-2.5 py-1.5 rounded hover:bg-gray-50 text-gray-700 font-medium"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OpportunitiesView({ opportunities, customers, contacts, flows }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [selectedFlowId, setSelectedFlowId] = useState("");
  const [isPending, startTransition] = useTransition();

  const activeStages = useMemo(() => {
    if (selectedFlowId) {
      const flow = flows.find((f) => f.id === selectedFlowId);
      if (flow?.stages?.length) return flow.stages;
    }
    return DEFAULT_STAGES;
  }, [selectedFlowId, flows]);

  const visibleOpps = useMemo(
    () => (selectedFlowId ? opportunities.filter((o) => o.flow_id === selectedFlowId) : opportunities),
    [selectedFlowId, opportunities]
  );

  const { byStage, mismatchedIds } = useMemo(() => {
    const map: Record<string, CrmOpportunity[]> = {};
    for (const s of activeStages) map[s] = [];
    const mismatched = new Set<string>();
    for (const opp of visibleOpps) {
      if (activeStages.includes(opp.stage)) {
        map[opp.stage].push(opp);
      } else if (activeStages.length > 0) {
        mismatched.add(opp.id);
        map[activeStages[0]].push(opp);
      }
    }
    return { byStage: map, mismatchedIds: mismatched };
  }, [visibleOpps, activeStages]);

  const totalValue = visibleOpps
    .filter((o) => o.status === "open")
    .reduce((sum, o) => sum + (o.value ?? 0), 0);
  const openCount = visibleOpps.filter((o) => o.status === "open").length;

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createOpportunity(formData);
      setShowForm(false);
    });
  }

  function handleMove(id: string, stage: string) {
    startTransition(() => moveOpportunity(id, stage));
  }

  function handleDelete(id: string) {
    startTransition(() => deleteOpportunity(id));
  }

  return (
    <div className="flex flex-col h-full" style={{ opacity: isPending ? 0.7 : 1 }}>
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <TrendingUp size={20} className="text-milestone-blue" />
            Opportunities
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {openCount} open · {fmt(totalValue) ?? "$0"} total pipeline
          </p>
        </div>
        <div className="flex items-center gap-3">
          {flows.length > 0 && (
            <select
              value={selectedFlowId}
              onChange={(e) => setSelectedFlowId(e.target.value)}
              className="text-sm border border-milestone-line rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-milestone-blue/20 focus:border-milestone-blue"
            >
              <option value="">All flows</option>
              {flows.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-milestone-blue text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showForm ? <X size={15} /> : <Plus size={15} />}
            {showForm ? "Cancel" : "Add Opportunity"}
          </button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mx-6 mb-4 bg-white rounded-xl shadow-card border border-milestone-line p-5 animate-fade-up shrink-0">
          <p className="text-sm font-bold text-gray-900 mb-4">New Opportunity</p>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="sm:col-span-2 lg:col-span-1">
                <label className={LABEL}>Title *</label>
                <input name="title" required placeholder="Enterprise deal with Acme" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Value ($)</label>
                <input name="value" type="number" step="0.01" min="0" placeholder="50000" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Stage</label>
                <select name="stage" className={INPUT} defaultValue="Lead">
                  {activeStages.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>Customer</label>
                <select name="customer_id" className={INPUT} defaultValue="">
                  <option value="">No customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>Contact</label>
                <select name="contact_id" className={INPUT} defaultValue="">
                  <option value="">No contact</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>Flow (pipeline)</label>
                <select name="flow_id" className={INPUT} defaultValue={selectedFlowId}>
                  <option value="">Default</option>
                  {flows.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>Close Date</label>
                <input name="close_date" type="date" className={INPUT} />
              </div>
            </div>
            <div className="mt-4">
              <label className={LABEL}>Notes</label>
              <textarea name="notes" rows={2} placeholder="Any context…" className={INPUT} />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 bg-milestone-blue text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Save Opportunity
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

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto px-6 pb-6">
        <div className="flex gap-4 h-full min-w-max">
          {activeStages.map((stage) => {
            const cards = byStage[stage] ?? [];
            const stageValue = cards.reduce((s, o) => s + (o.value ?? 0), 0);
            const colBg = STAGE_COLORS[stage] ?? "bg-gray-50/80 border-gray-200/60";
            const headerCls = STAGE_HEADER[stage] ?? "text-gray-700";

            return (
              <div
                key={stage}
                className={`flex flex-col rounded-xl border ${colBg} w-[260px] shrink-0`}
              >
                {/* Column header */}
                <div className="px-4 pt-4 pb-3 border-b border-black/5">
                  <div className="flex items-center justify-between">
                    <p className={`text-[13px] font-bold ${headerCls}`}>{stage}</p>
                    <span className="text-[11px] font-semibold text-gray-400 bg-white/70 px-1.5 py-0.5 rounded-full">
                      {cards.length}
                    </span>
                  </div>
                  {stageValue > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">{fmt(stageValue)}</p>
                  )}
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                  {cards.map((opp) => (
                    <OppCard
                      key={opp.id}
                      opp={opp}
                      stages={activeStages}
                      isMismatched={mismatchedIds.has(opp.id)}
                      onMove={handleMove}
                      onDelete={handleDelete}
                    />
                  ))}
                  {cards.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-xs text-gray-300">Empty</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
