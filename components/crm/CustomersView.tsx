"use client";

import { useState, useTransition, useMemo } from "react";
import { Building2, Plus, Search, Trash2, X, Target } from "lucide-react";
import type { CrmCustomer, CustomerStatus } from "@/lib/types";
import { createCustomer, deleteCustomer, updateCustomerStatus } from "@/app/customers/actions";

const STATUS_STYLES: Record<CustomerStatus, string> = {
  prospect: "bg-milestone-amber-dim text-milestone-amber",
  active: "bg-milestone-green-dim text-milestone-green",
  inactive: "bg-gray-100 text-gray-400",
};

const INPUT =
  "w-full px-3 py-2 text-sm border border-milestone-line rounded-lg focus:outline-none focus:ring-2 focus:ring-milestone-blue/20 focus:border-milestone-blue bg-white";

const LABEL = "block text-xs font-medium text-gray-500 mb-1";

export default function CustomersView({
  customers,
  goalCounts = {},
  labelPlural = "Companies",
  labelSingular = "Company",
}: {
  customers: CrmCustomer[];
  goalCounts?: Record<string, number>;
  labelPlural?: string;
  labelSingular?: string;
}) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(
    () =>
      customers.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          (c.industry ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (c.email ?? "").toLowerCase().includes(search.toLowerCase())
      ),
    [customers, search]
  );

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createCustomer(formData);
      setShowForm(false);
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm("Delete this customer? This cannot be undone.")) return;
    startTransition(() => deleteCustomer(id));
  }

  function handleStatusChange(id: string, status: string) {
    startTransition(() => updateCustomerStatus(id, status));
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
          <p className="text-sm font-bold text-gray-900 mb-4">New Customer</p>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className={LABEL}>Company Name *</label>
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
                Save Customer
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
          placeholder="Search customers…"
          className="w-full pl-9 pr-4 py-2 text-sm border border-milestone-line rounded-lg focus:outline-none focus:ring-2 focus:ring-milestone-blue/20 focus:border-milestone-blue bg-white"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card border border-milestone-line p-14 text-center">
          <Building2 size={36} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm font-medium text-gray-400">
            {search ? "No customers match your search." : "No customers yet."}
          </p>
          {!search && (
            <p className="text-xs text-gray-300 mt-1">Click &quot;Add Customer&quot; to get started.</p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-card border border-milestone-line overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-milestone-line bg-gray-50/60">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Company
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                  Industry
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  Email
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                  Phone
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-b border-milestone-line last:border-0 hover:bg-gray-50/50 transition-colors"
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
                  <td className="px-4 py-3.5 text-gray-500 hidden lg:table-cell">
                    {customer.phone ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    <select
                      value={customer.status}
                      onChange={(e) => handleStatusChange(customer.id, e.target.value)}
                      className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer ${
                        STATUS_STYLES[customer.status]
                      }`}
                    >
                      <option value="prospect">Prospect</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => handleDelete(customer.id)}
                      className="text-gray-300 hover:text-milestone-red transition-colors"
                      title="Delete customer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
