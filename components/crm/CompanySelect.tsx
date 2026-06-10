"use client";

import { useState } from "react";
import type { CrmCustomer } from "@/lib/types";

const INPUT = "ms-input";
const LABEL = "ms-label";

export const NEW_CUSTOMER_VALUE = "__new__";

export default function CompanySelect({
  customers,
  defaultValue = "",
  value,
  onValueChange,
  onNewModeChange,
  label = "Company",
  noCompanyLabel = "No company",
  addNewLabel = "+ Add new company…",
}: {
  customers: Pick<CrmCustomer, "id" | "name">[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (customerId: string) => void;
  onNewModeChange?: (isNew: boolean) => void;
  label?: string;
  noCompanyLabel?: string;
  addNewLabel?: string;
}) {
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const isControlled = value !== undefined;

  function enterNewMode() {
    setMode("new");
    onNewModeChange?.(true);
    onValueChange?.("");
  }

  function exitNewMode() {
    setMode("existing");
    onNewModeChange?.(false);
  }

  if (mode === "new") {
    return (
      <div>
        <label className={LABEL}>{label}</label>
        <input
          name="new_customer_name"
          required
          placeholder="Company name"
          className={INPUT}
          autoFocus
        />
        <button
          type="button"
          onClick={exitNewMode}
          className="mt-1 text-xs text-milestone-blue hover:underline"
        >
          Choose existing company
        </button>
      </div>
    );
  }

  const selectProps = isControlled
    ? { value, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onValueChange?.(e.target.value) }
    : { defaultValue };

  return (
    <div>
      <label className={LABEL}>{label}</label>
      <select
        name="customer_id"
        className={INPUT}
        {...selectProps}
        onChange={(e) => {
          if (e.target.value === NEW_CUSTOMER_VALUE) {
            enterNewMode();
            return;
          }
          if (isControlled) onValueChange?.(e.target.value);
        }}
      >
        <option value="">{noCompanyLabel}</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
        <option value={NEW_CUSTOMER_VALUE}>{addNewLabel}</option>
      </select>
    </div>
  );
}
