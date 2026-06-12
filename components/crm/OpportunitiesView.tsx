"use client";

import { useState, useTransition, useMemo, useRef, useEffect } from "react";
import { TrendingUp, Plus, X, ChevronRight, Trash2, DollarSign, LayoutGrid, List } from "lucide-react";
import type { CrmOpportunity, CrmCustomer, CrmContact, CrmFlow } from "@/lib/types";
import type { CustomFieldDef } from "@/lib/customFields";
import {
  createOpportunity,
  deleteOpportunity,
  moveOpportunity,
} from "@/app/opportunities/actions";
import CustomFieldInput from "./CustomFieldInput";
import CompanySelect from "./CompanySelect";

const DEFAULT_STAGES = ["Lead", "Qualified", "Proposal", "Negotiation", "Won", "Lost"];

const STAGE_COLORS: Record<string, string> = {
  Won: "ms-kanban-col-won bg-milestone-green-dim border-milestone-green/20",
  Lost: "ms-kanban-col-lost bg-milestone-red-dim border-milestone-red/20",
};

const STAGE_HEADER: Record<string, string> = {
  Won: "text-milestone-green",
  Lost: "text-milestone-red",
};

const DEFAULT_COL_BG = "ms-kanban-col bg-gray-50/80 border-gray-200/60";

type ViewMode = "kanban" | "list";

const INPUT = "ms-input";
const LABEL = "ms-label";

interface Props {
  opportunities: CrmOpportunity[];
  customers: Pick<CrmCustomer, "id" | "name">[];
  contacts: Pick<CrmContact, "id" | "first_name" | "last_name" | "customer_id">[];
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
    <div className="ms-surface p-3 group">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-gray-900 dark:text-white/95 text-[13px] leading-snug flex-1">{opp.title}</p>
        <button
          type="button"
          onClick={() => onDelete(opp.id)}
          title="Delete deal"
          aria-label={`Delete ${opp.title}`}
          className="text-gray-400 dark:text-white/40 hover:text-milestone-red transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 shrink-0 mt-0.5 p-1"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {opp.crm_customers && (
        <p className="text-xs text-gray-500 dark:text-white/50 mt-1">{opp.crm_customers.name}</p>
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
          <span className="text-xs text-gray-400 dark:text-white/45 flex items-center gap-0.5">
            <DollarSign size={11} />—
          </span>
        )}
        {opp.close_date && (
          <span className="text-[11px] text-gray-500 dark:text-white/45">
            {(() => {
              const [y, m, d] = opp.close_date.split("-").map(Number);
              return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
            })()}
          </span>
        )}
      </div>

      {/* Move stage */}
      {otherStages.length > 0 && (
        <div ref={dropdownRef} className="relative mt-2.5 pt-2.5 border-t border-milestone-line dark:border-white/[0.08]">
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-[11px] text-gray-500 dark:text-white/50 hover:text-milestone-blue transition-colors flex items-center gap-0.5"
          >
            Move stage <ChevronRight size={11} />
          </button>
          {open && (
            <div className="absolute top-full mt-1 left-0 bg-white dark:bg-[#0B1929] rounded-lg shadow-card-lg border border-milestone-line dark:border-white/[0.08] p-1 z-20 min-w-[130px]">
              {otherStages.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    onMove(opp.id, s);
                    setOpen(false);
                  }}
                  className="block w-full text-left text-[12px] px-2.5 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-white/[0.05] text-gray-700 dark:text-white/80 font-medium"
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

export default function OpportunitiesView({
  opportunities,
  customers,
  contacts,
  flows,
  customFields = [],
  labelPlural = "Opportunities",
  labelSingular = "Opportunity",
}: Props & { customFields?: CustomFieldDef[]; labelPlural?: string; labelSingular?: string }) {
  const [showForm, setShowForm] = useState(false);
  const [selectedFlowId, setSelectedFlowId] = useState("");
  const [formCustomerId, setFormCustomerId] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    try {
      const saved = localStorage.getItem("opportunities-view");
      if (saved === "list" || saved === "kanban") setViewMode(saved);
    } catch {}
  }, []);

  function switchView(mode: ViewMode) {
    setViewMode(mode);
    try {
      localStorage.setItem("opportunities-view", mode);
    } catch {}
  }

  // Contacts shown in the add form are limited to the chosen company (when one is set).
  const formContacts = useMemo(
    () => (formCustomerId ? contacts.filter((c) => c.customer_id === formCustomerId) : contacts),
    [formCustomerId, contacts]
  );

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
    const opp = opportunities.find((o) => o.id === id);
    const label = opp?.title ?? "this deal";
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;
    startTransition(() => deleteOpportunity(id));
  }

  return (
    <div className="flex flex-col h-full" style={{ opacity: isPending ? 0.7 : 1 }}>
      {/* Header */}
      <div className="px-4 md:px-6 pt-4 md:pt-5 pb-3 flex items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="ms-page-title">
            <TrendingUp size={18} className="text-milestone-blue" />
            {labelPlural}
          </h1>
          <p className="ms-page-subtitle">
            {openCount} open · {fmt(totalValue) ?? "$0"} total pipeline
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div className="ms-segment shrink-0">
            <button
              type="button"
              onClick={() => switchView("kanban")}
              className={`ms-segment-btn flex items-center gap-1.5 ${
                viewMode === "kanban" ? "ms-segment-btn-active" : "ms-segment-btn-inactive"
              }`}
              aria-pressed={viewMode === "kanban"}
            >
              <LayoutGrid size={14} />
              <span className="hidden sm:inline">Board</span>
            </button>
            <button
              type="button"
              onClick={() => switchView("list")}
              className={`ms-segment-btn flex items-center gap-1.5 ${
                viewMode === "list" ? "ms-segment-btn-active" : "ms-segment-btn-inactive"
              }`}
              aria-pressed={viewMode === "list"}
            >
              <List size={14} />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
          {flows.length > 0 && (
            <select
              value={selectedFlowId}
              onChange={(e) => setSelectedFlowId(e.target.value)}
              className="ms-input w-auto py-1.5"
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
            onClick={() => {
              setShowForm((open) => {
                if (!open) setFormCustomerId("");
                return !open;
              });
            }}
            className="ms-btn-primary"
          >
            {showForm ? <X size={15} /> : <Plus size={15} />}
            {showForm ? "Cancel" : `Add ${labelSingular}`}
          </button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mx-4 md:mx-6 mb-3 ms-surface p-4 animate-fade-up shrink-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">New opportunity</p>
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
              <CompanySelect
                customers={customers}
                onValueChange={setFormCustomerId}
                label="Customer"
                noCompanyLabel="No customer"
              />
              <div>
                <label className={LABEL}>Contact</label>
                <select name="contact_id" className={INPUT} defaultValue="" key={formCustomerId}>
                  <option value="">No contact</option>
                  {formContacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name}
                    </option>
                  ))}
                </select>
                {formCustomerId && formContacts.length === 0 && (
                  <p className="text-[11px] text-gray-400 mt-1">No contacts for this company yet.</p>
                )}
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
              {customFields.map((f) => (
                <CustomFieldInput key={f.id} field={f} />
              ))}
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

      {viewMode === "kanban" ? (
        <div className="flex-1 overflow-x-auto px-4 md:px-6 pb-6">
          <div className="flex gap-4 h-full min-w-max">
            {activeStages.map((stage) => {
              const cards = byStage[stage] ?? [];
              const stageValue = cards.reduce((s, o) => s + (o.value ?? 0), 0);
              const colBg = STAGE_COLORS[stage] ?? DEFAULT_COL_BG;
              const headerCls = STAGE_HEADER[stage] ?? "text-gray-700 dark:text-white/85";

              return (
                <div
                  key={stage}
                  className={`flex flex-col rounded-xl border ${colBg} w-[260px] shrink-0`}
                >
                  <div className="px-4 pt-4 pb-3 border-b border-black/5 dark:border-white/[0.06]">
                    <div className="flex items-center justify-between">
                      <p className={`text-[13px] font-bold ${headerCls}`}>{stage}</p>
                      <span className="text-[11px] font-semibold text-gray-500 dark:text-white/55 bg-white/70 dark:bg-white/10 px-1.5 py-0.5 rounded-full">
                        {cards.length}
                      </span>
                    </div>
                    {stageValue > 0 && (
                      <p className="text-xs text-gray-500 dark:text-white/45 mt-0.5">{fmt(stageValue)}</p>
                    )}
                  </div>

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
                        <p className="text-xs text-gray-400 dark:text-white/30">Empty</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-6">
          {visibleOpps.length === 0 ? (
            <div className="ms-empty">
              <TrendingUp size={28} className="mx-auto mb-2 text-gray-300 dark:text-white/25" />
              <p className="text-sm font-medium text-gray-500 dark:text-white/50">No opportunities yet.</p>
            </div>
          ) : (
            <>
              <div className="md:hidden space-y-3">
                {visibleOpps.map((opp) => (
                  <div key={opp.id} className="ms-surface p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white leading-tight">{opp.title}</p>
                        {opp.crm_customers && (
                          <p className="text-xs text-gray-500 dark:text-white/50 mt-0.5">{opp.crm_customers.name}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-milestone-blue-dim text-milestone-blue">
                            {opp.stage}
                          </span>
                          {opp.value != null && (
                            <span className="text-xs font-bold text-milestone-blue">{fmt(opp.value)}</span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(opp.id)}
                        className="p-2 text-gray-400 dark:text-white/40 hover:text-milestone-red"
                        aria-label={`Delete ${opp.title}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    {activeStages.filter((s) => s !== opp.stage).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-milestone-line dark:border-white/[0.08]">
                        <label className="text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-white/40">
                          Move stage
                        </label>
                        <select
                          value={opp.stage}
                          onChange={(e) => handleMove(opp.id, e.target.value)}
                          className="ms-input mt-1 py-1.5 text-xs"
                        >
                          {activeStages.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="hidden md:block ms-surface overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-milestone-line bg-gray-50/50 dark:bg-white/[0.03]">
                      <th className="ms-table-head pl-4 text-left">Title</th>
                      <th className="ms-table-head text-left hidden lg:table-cell">Customer</th>
                      <th className="ms-table-head text-left">Stage</th>
                      <th className="ms-table-head text-left hidden sm:table-cell">Value</th>
                      <th className="ms-table-head text-left hidden xl:table-cell">Close</th>
                      <th className="px-4 py-2 w-24" />
                    </tr>
                  </thead>
                  <tbody>
                    {visibleOpps.map((opp) => (
                      <tr
                        key={opp.id}
                        className="border-b border-milestone-line/70 dark:border-white/[0.06] hover:bg-gray-50/50 dark:hover:bg-white/[0.03]"
                      >
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{opp.title}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-white/50 hidden lg:table-cell">
                          {opp.crm_customers?.name ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={opp.stage}
                            onChange={(e) => handleMove(opp.id, e.target.value)}
                            className="ms-input w-auto py-1 text-xs min-w-[7rem]"
                          >
                            {activeStages.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 font-semibold text-milestone-blue hidden sm:table-cell">
                          {fmt(opp.value) ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-white/45 hidden xl:table-cell">
                          {opp.close_date
                            ? (() => {
                                const [y, m, d] = opp.close_date.split("-").map(Number);
                                return new Date(y, m - 1, d).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                });
                              })()
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(opp.id)}
                            className="p-1.5 rounded-lg text-gray-400 dark:text-white/40 hover:text-milestone-red hover:bg-milestone-red-dim transition-colors"
                            aria-label={`Delete ${opp.title}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
