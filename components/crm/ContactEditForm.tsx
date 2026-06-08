"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import type { CrmContact, CrmCustomer } from "@/lib/types";
import type { CustomFieldDef } from "@/lib/customFields";
import { updateContact, deleteContact } from "@/app/contacts/actions";
import CustomFieldInput from "./CustomFieldInput";

const INPUT =
  "w-full px-3 py-2 text-sm border border-milestone-line rounded-lg focus:outline-none focus:ring-2 focus:ring-milestone-blue/20 focus:border-milestone-blue bg-white";
const LABEL = "block text-xs font-medium text-gray-500 mb-1";

export default function ContactEditForm({
  contact,
  customers,
  customFields = [],
  labelSingular = "Contact",
  onSaved,
  onDeleted,
}: {
  contact: CrmContact;
  customers: Pick<CrmCustomer, "id" | "name">[];
  customFields?: CustomFieldDef[];
  labelSingular?: string;
  onSaved?: () => void;
  onDeleted?: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateContact(contact.id, formData);
      onSaved?.();
    });
  }

  function handleDelete() {
    if (!window.confirm(`Delete this ${labelSingular.toLowerCase()}? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteContact(contact.id);
      onDeleted?.();
    });
  }

  return (
    <form onSubmit={handleUpdate} className="space-y-4" style={{ opacity: isPending ? 0.7 : 1 }}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>First Name *</label>
          <input name="first_name" required defaultValue={contact.first_name} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Last Name *</label>
          <input name="last_name" required defaultValue={contact.last_name} className={INPUT} />
        </div>
      </div>
      <div>
        <label className={LABEL}>Job Title</label>
        <input name="title" defaultValue={contact.title ?? ""} className={INPUT} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Email</label>
          <input name="email" type="email" defaultValue={contact.email ?? ""} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Phone</label>
          <input name="phone" defaultValue={contact.phone ?? ""} className={INPUT} />
        </div>
      </div>
      <div>
        <label className={LABEL}>Company</label>
        <select name="customer_id" className={INPUT} defaultValue={contact.customer_id ?? ""}>
          <option value="">No company</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={LABEL}>Notes</label>
        <textarea name="notes" rows={3} defaultValue={contact.notes ?? ""} className={INPUT} />
      </div>
      {customFields.length > 0 && (
        <div className="grid grid-cols-2 gap-3 border-t border-milestone-line pt-4">
          {customFields.map((f) => (
            <CustomFieldInput key={f.id} field={f} value={contact.custom?.[f.id]} />
          ))}
        </div>
      )}
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
          onClick={handleDelete}
          className="text-sm text-gray-400 hover:text-milestone-red transition-colors flex items-center gap-1"
        >
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </form>
  );
}
