"use client";

import { useState, useTransition, useMemo } from "react";
import { UserRound, Plus, Search, Trash2, X } from "lucide-react";
import type { CrmContact, CrmCustomer } from "@/lib/types";
import { createContact, deleteContact } from "@/app/contacts/actions";

const INPUT =
  "w-full px-3 py-2 text-sm border border-milestone-line rounded-lg focus:outline-none focus:ring-2 focus:ring-milestone-blue/20 focus:border-milestone-blue bg-white";

const LABEL = "block text-xs font-medium text-gray-500 mb-1";

interface Props {
  contacts: CrmContact[];
  customers: Pick<CrmCustomer, "id" | "name">[];
}

export default function ContactsView({ contacts, customers }: Props) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(
    () =>
      contacts.filter((c) => {
        const full = `${c.first_name} ${c.last_name}`.toLowerCase();
        const q = search.toLowerCase();
        return (
          full.includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.title?.toLowerCase().includes(q) ||
          c.crm_customers?.name.toLowerCase().includes(q)
        );
      }),
    [contacts, search]
  );

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createContact(formData);
      setShowForm(false);
    });
  }

  function handleDelete(id: string) {
    startTransition(() => deleteContact(id));
  }

  return (
    <div className="p-6 max-w-6xl" style={{ opacity: isPending ? 0.7 : 1 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <UserRound size={20} className="text-milestone-blue" />
            Contacts
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">{contacts.length} total</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-milestone-blue text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? "Cancel" : "Add Contact"}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-card border border-milestone-line p-5 mb-5 animate-fade-up">
          <p className="text-sm font-bold text-gray-900 mb-4">New Contact</p>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className={LABEL}>First Name *</label>
                <input name="first_name" required placeholder="Jane" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Last Name *</label>
                <input name="last_name" required placeholder="Smith" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Job Title</label>
                <input name="title" placeholder="VP of Sales" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Email</label>
                <input name="email" type="email" placeholder="jane@acme.com" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Phone</label>
                <input name="phone" placeholder="+1 555 000 0000" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Company</label>
                <select name="customer_id" className={INPUT} defaultValue="">
                  <option value="">No company</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
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
                Save Contact
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
          placeholder="Search contacts…"
          className="w-full pl-9 pr-4 py-2 text-sm border border-milestone-line rounded-lg focus:outline-none focus:ring-2 focus:ring-milestone-blue/20 focus:border-milestone-blue bg-white"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card border border-milestone-line p-14 text-center">
          <UserRound size={36} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm font-medium text-gray-400">
            {search ? "No contacts match your search." : "No contacts yet."}
          </p>
          {!search && (
            <p className="text-xs text-gray-300 mt-1">Click &quot;Add Contact&quot; to get started.</p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-card border border-milestone-line overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-milestone-line bg-gray-50/60">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                  Title
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  Email
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                  Phone
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((contact) => {
                const initials = `${contact.first_name[0]}${contact.last_name[0]}`.toUpperCase();
                return (
                  <tr
                    key={contact.id}
                    className="border-b border-milestone-line last:border-0 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-milestone-blue flex items-center justify-center shrink-0">
                          <span className="text-white text-xs font-bold">{initials}</span>
                        </div>
                        <p className="font-semibold text-gray-900">
                          {contact.first_name} {contact.last_name}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 hidden sm:table-cell">
                      {contact.title ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 hidden md:table-cell">
                      {contact.email ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 hidden lg:table-cell">
                      {contact.phone ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      {contact.crm_customers ? (
                        <span className="text-xs font-medium text-milestone-blue bg-milestone-blue-dim px-2 py-0.5 rounded-full">
                          {contact.crm_customers.name}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(contact.id)}
                        className="text-gray-300 hover:text-milestone-red transition-colors"
                        title="Delete contact"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
