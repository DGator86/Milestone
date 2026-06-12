"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";

const INPUT = "ms-input";
const LABEL = "ms-label";

type Option = { id: string; label: string };

function HiddenIds({ name, ids }: { name: string; ids: string[] }) {
  return (
    <>
      {ids.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
    </>
  );
}

export function MultiEntityPicker({
  options,
  selectedIds,
  onChange,
  name,
  label,
  placeholder = "Add…",
  emptyHint,
}: {
  options: Option[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  name: string;
  label: string;
  placeholder?: string;
  emptyHint?: string;
}) {
  const selected = useMemo(
    () => selectedIds.map((id) => options.find((option) => option.id === id)).filter(Boolean) as Option[],
    [options, selectedIds],
  );

  const available = options.filter((option) => !selectedIds.includes(option.id));

  function add(id: string) {
    if (!id || selectedIds.includes(id)) return;
    onChange([...selectedIds, id]);
  }

  function remove(id: string) {
    onChange(selectedIds.filter((selectedId) => selectedId !== id));
  }

  return (
    <div>
      <label className={LABEL}>{label}</label>
      <HiddenIds name={name} ids={selectedIds} />
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1 text-xs font-semibold rounded-lg px-2.5 py-1.5 bg-milestone-blue-dim text-milestone-blue"
            >
              {item.label}
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="text-milestone-blue/70 hover:text-milestone-blue"
                aria-label={`Remove ${item.label}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      <select
        className={INPUT}
        value=""
        onChange={(e) => {
          add(e.target.value);
          e.currentTarget.value = "";
        }}
      >
        <option value="">{placeholder}</option>
        {available.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      {emptyHint && selected.length === 0 && (
        <p className="text-[11px] text-gray-400 dark:text-white/40 mt-1">{emptyHint}</p>
      )}
    </div>
  );
}

export function MultiCompanyPicker({
  customers,
  selectedIds,
  onChange,
  label = "Companies",
  placeholder = "Add company…",
  noCompanyLabel = "No companies",
}: {
  customers: Array<{ id: string; name: string }>;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  label?: string;
  placeholder?: string;
  noCompanyLabel?: string;
}) {
  const [newMode, setNewMode] = useState(false);

  const options = customers.map((customer) => ({
    id: customer.id,
    label: customer.name,
  }));

  const selected = useMemo(
    () => selectedIds.map((id) => options.find((option) => option.id === id)).filter(Boolean) as Option[],
    [options, selectedIds],
  );

  if (newMode) {
    return (
      <div>
        <label className={LABEL}>{label}</label>
        <HiddenIds name="customer_ids" ids={selectedIds} />
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {selected.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-1 text-xs font-semibold rounded-lg px-2.5 py-1.5 bg-milestone-blue-dim text-milestone-blue"
              >
                {item.label}
              </span>
            ))}
          </div>
        )}
        <input
          name="new_customer_name"
          required
          placeholder="Company name"
          className={INPUT}
          autoFocus
        />
        <button
          type="button"
          onClick={() => setNewMode(false)}
          className="mt-1 text-xs text-milestone-blue hover:underline"
        >
          Choose existing companies
        </button>
      </div>
    );
  }

  return (
    <div>
      <MultiEntityPicker
        options={options}
        selectedIds={selectedIds}
        onChange={onChange}
        name="customer_ids"
        label={label}
        placeholder={placeholder}
        emptyHint={noCompanyLabel}
      />
      <button
        type="button"
        onClick={() => setNewMode(true)}
        className="mt-1.5 block text-xs font-medium text-milestone-blue hover:underline text-left"
      >
        + Add new company…
      </button>
    </div>
  );
}

export function MultiContactPicker({
  contacts,
  selectedIds,
  onChange,
  customerIds = [],
  label = "Contacts",
  placeholder = "Add contact…",
}: {
  contacts: Array<{
    id: string;
    first_name: string;
    last_name: string;
    customer_id: string | null;
  }>;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  customerIds?: string[];
  label?: string;
  placeholder?: string;
}) {
  const filteredContacts = useMemo(() => {
    if (!customerIds.length) return contacts;
    return contacts.filter(
      (contact) => !contact.customer_id || customerIds.includes(contact.customer_id),
    );
  }, [contacts, customerIds]);

  const options = filteredContacts.map((contact) => ({
    id: contact.id,
    label: `${contact.first_name} ${contact.last_name}`.trim(),
  }));

  return (
    <MultiEntityPicker
      options={options}
      selectedIds={selectedIds}
      onChange={onChange}
      name="contact_ids"
      label={label}
      placeholder={placeholder}
      emptyHint={
        customerIds.length && filteredContacts.length === 0
          ? "No contacts for the selected companies yet."
          : undefined
      }
    />
  );
}
