"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Search,
  Trash2,
  X,
  Target,
  ChevronUp,
  ChevronDown,
  Mail,
  Phone,
  Globe,
  UserRound,
  TrendingUp,
} from "lucide-react";
import type { CrmCustomer, CustomerStatus } from "@/lib/types";
import { createCustomer, updateCustomer, deleteCustomer } from "@/app/customers/actions";
import SlideOver from "./SlideOver";

const STATUS_STYLES: Record<CustomerStatus, string> = {
  prospect: "bg-milestone-amber-dim text-milestone-amber",
  active: "bg-milestone-green-dim text-milestone-green",
  inactive: "bg-gray-100 text-gray-400",
};

const INPUT =
  "w-full px-3 py-2 text-sm border border-milestone-line rounded-lg focus:outline-none focus:ring-2 focus:ring-milestone-blue/20 focus:border-milestone-blue bg-white";

const LABEL = "block text-xs font-medium text-gray-500 mb-1";

type PortalContact = { id: string; first_name: string; last_name: string; title: string | null };
type PortalOpp = { id: string; title: string; stage: string; value: number | null };

type SortKey = "name" | "industry" | "status" | "created";

export default function CustomersView({
  customers,
  goalCounts = {},
  contactsByCustomer = {},
  oppsByCustomer = {},
  labelPlural = "Companies",
  labelSingular = "Company",
  contactLabelPlural = "Contacts",
  oppLabelPlural = "Opportunities",
}: {
  customers: CrmCustomer[];
  goalCounts?: Record<string, number>;
  contactsByCustomer?: Record<string, PortalContact[]>;
  oppsByCustomer?: Record<string, PortalOpp[]>;
  labelPlural?: string;
  labelSingular?: string;
  contactLabelPlural?: string;
  oppLabelPlural?: string;
}) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [isPending, startTransition] = useTransition();

  const selected = customers.find((c) => c.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const rows = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.industry ?? "").toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q)
    );
    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      if (sortKey === "name") {
        av = a.name.toLowerCase();
        bv = b.name.toLowerCase();
      } else if (sortKey === "industry") {
        av = (a.industry ?? "").toLowerCase();
        bv = (b.industry ?? "").toLowerCase();
      } else if (sortKey === "status") {
        av = a.status;
        bv = b.status;
      } else {
        av = a.created_at ?? "";
        bv = b.created_at ?? "";
      }
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [customers, search, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "created" ? "desc" : "asc");
    }
  }

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createCustomer(formData);
      setShowForm(false);
    });
  }

  function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const formData = new FormData(e.currentTarget);
    const id = selected.id;
    startTransition(async () => {
      await updateCustomer(id, formData);
      setSelectedId(null);
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm(`Delete this ${labelSingular.toLowerCase()}? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteCustomer(id);
      setSelectedId(null);
    });
  }

  function SortHeader({ label, k, className = "" }: { label: string; k: SortKey; className?: string }) {
    const active = sortKey === k;
    return (
      <th className={`text-left px-4 py-3 ${className}`}>
        <button
          onClick={() => toggleSort(k)}
          className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wider transition-colors ${
            active ? "text-milestone-blue" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          {label}
          {active &&
            (sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
        </button>
      </th>
    );
  }

  return (
    <div className="p-6 max-w-6xl" style={{ opacity: isPending ? 0.7 : 1 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Building2 size={20} className="text-milestone-blue" />
            {labelPlural}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {customers.length} total · {customers.filter((c) => c.status === "active").length} active
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-milestone-blue text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? "Cancel" : `Add ${labelSingular}`}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-card border border-milestone-line p-5 mb-5 animate-fade-up">
          <p className="text-sm font-bold text-gray-900 mb-4">New {labelSingular}</p>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className={LABEL}>{labelSingular} Name *</label>
                <input name="name" required placeholder="Acme Corp" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Industry</label>
                <input name="industry" placeholder="SaaS, Retail…" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Status</label>
                <select name="status" className={INPUT} defaultValue="prospect">
                  <option value="prospect">Prospect</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className={LABEL}>Email</label>
                <input name="email" type="email" placeholder="hello@acme.com" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Phone</label>
                <input name="phone" placeholder="+1 555 000 0000" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Website</label>
                <input name="website" placeholder="https://acme.com" className={INPUT} />
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
                Save {labelSingular}
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

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${labelPlural.toLowerCase()}…`}
          className="w-full pl-9 pr-4 py-2 text-sm border border-milestone-line rounded-lg focus:outline-none focus:ring-2 focus:ring-milestone-blue/20 focus:border-milestone-blue bg-white"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card border border-milestone-line p-14 text-center">
          <Building2 size={36} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm font-medium text-gray-400">
            {search ? `No ${labelPlural.toLowerCase()} match your search.` : `No ${labelPlural.toLowerCase()} yet.`}
          </p>
          {!search && (
            <p className="text-xs text-gray-300 mt-1">Click &quot;Add {labelSingular}&quot; to get started.</p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-card border border-milestone-line overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-milestone-line bg-gray-50/60">
                <SortHeader label={labelSingular} k="name" className="pl-5" />
                <SortHeader label="Industry" k="industry" className="hidden sm:table-cell" />
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  Email
                </th>
                <SortHeader label="Status" k="status" />
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => (
                <tr
                  key={customer.id}
                  onClick={() => setSelectedId(customer.id)}
                  className="border-b border-milestone-line last:border-0 hover:bg-milestone-blue-dim/40 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-milestone-blue-dim flex items-center justify-center shrink-0">
                        <Building2 size={14} className="text-milestone-blue" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{customer.name}</p>
                          {goalCounts[customer.id] > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-milestone-blue-dim text-milestone-blue">
                              <Target size={10} />
                              {goalCounts[customer.id]}
                            </span>
                          )}
                        </div>
                        {customer.website && (
                          <p className="text-xs text-gray-400 truncate max-w-[180px]">
                            {customer.website.replace(/^https?:\/\//, "")}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-gray-500 hidden sm:table-cell">
                    {customer.industry ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3.5 text-gray-500 hidden md:table-cell">
                    {customer.email ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[customer.status]}`}
                    >
                      {customer.status[0].toUpperCase() + customer.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right text-gray-300">
                    <ChevronDown size={15} className="-rotate-90 inline" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail / edit portal */}
      <SlideOver
        open={!!selected}
        onClose={() => setSelectedId(null)}
        title={selected?.name ?? ""}
        subtitle={`Edit ${labelSingular.toLowerCase()} · view related records`}
      >
        {selected && (
          <div className="space-y-6">
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className={LABEL}>{labelSingular} Name *</label>
                <input name="name" required defaultValue={selected.name} className={INPUT} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Industry</label>
                  <input name="industry" defaultValue={selected.industry ?? ""} className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Status</label>
                  <select name="status" className={INPUT} defaultValue={selected.status}>
                    <option value="prospect">Prospect</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Email</label>
                  <input name="email" type="email" defaultValue={selected.email ?? ""} className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Phone</label>
                  <input name="phone" defaultValue={selected.phone ?? ""} className={INPUT} />
                </div>
              </div>
              <div>
                <label className={LABEL}>Website</label>
                <input name="website" defaultValue={selected.website ?? ""} className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Notes</label>
                <textarea name="notes" rows={3} defaultValue={selected.notes ?? ""} className={INPUT} />
              </div>
              <div className="flex items-center justify-between pt-1">
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-milestone-blue text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Save changes
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(selected.id)}
                  className="text-sm text-gray-400 hover:text-milestone-red transition-colors flex items-center gap-1"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </form>

            {/* Quick contact links */}
            <div className="flex flex-wrap gap-3 text-xs text-gray-400 border-t border-milestone-line pt-4">
              {selected.email && (
                <span className="flex items-center gap-1"><Mail size={12} /> {selected.email}</span>
              )}
              {selected.phone && (
                <span className="flex items-center gap-1"><Phone size={12} /> {selected.phone}</span>
              )}
              {selected.website && (
                <a
                  href={selected.website.startsWith("http") ? selected.website : `https://${selected.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-milestone-blue"
                >
                  <Globe size={12} /> Website
                </a>
              )}
            </div>

            {/* Related contacts */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <UserRound size={13} /> {contactLabelPlural}
                <span className="text-gray-300">({(contactsByCustomer[selected.id] ?? []).length})</span>
              </p>
              {(contactsByCustomer[selected.id] ?? []).length === 0 ? (
                <p className="text-xs text-gray-300">No related {contactLabelPlural.toLowerCase()}.</p>
              ) : (
                <div className="space-y-1.5">
                  {(contactsByCustomer[selected.id] ?? []).map((ct) => (
                    <Link
                      key={ct.id}
                      href="/contacts"
                      className="flex items-center justify-between rounded-lg border border-milestone-line px-3 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-800">
                        {ct.first_name} {ct.last_name}
                      </span>
                      {ct.title && <span className="text-xs text-gray-400">{ct.title}</span>}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Related opportunities */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <TrendingUp size={13} /> {oppLabelPlural}
                <span className="text-gray-300">({(oppsByCustomer[selected.id] ?? []).length})</span>
              </p>
              {(oppsByCustomer[selected.id] ?? []).length === 0 ? (
                <p className="text-xs text-gray-300">No related {oppLabelPlural.toLowerCase()}.</p>
              ) : (
                <div className="space-y-1.5">
                  {(oppsByCustomer[selected.id] ?? []).map((op) => (
                    <Link
                      key={op.id}
                      href="/opportunities"
                      className="flex items-center justify-between rounded-lg border border-milestone-line px-3 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-800 truncate">{op.title}</span>
                      <span className="flex items-center gap-2 shrink-0">
                        {op.value != null && (
                          <span className="text-xs font-bold text-milestone-blue">
                            ${op.value.toLocaleString()}
                          </span>
                        )}
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          {op.stage}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}
