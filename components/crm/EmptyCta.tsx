"use client";

import { Target } from "lucide-react";
import { prefillNewGoal } from "@/lib/crm/prefill";

export default function EmptyCta({
  message,
  goalTitle,
  customerId,
  crmContactId,
  buttonLabel = "Create goal",
}: {
  message: string;
  goalTitle?: string;
  customerId?: string;
  crmContactId?: string;
  buttonLabel?: string;
}) {
  return (
    <div className="text-center py-6 px-4">
      <Target size={28} className="mx-auto text-gray-200 mb-2" />
      <p className="text-sm text-gray-400 mb-3">{message}</p>
      <button
        type="button"
        onClick={() =>
          prefillNewGoal({
            title: goalTitle,
            customer_id: customerId,
            crm_contact_id: crmContactId,
          })
        }
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-milestone-blue text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Target size={13} />
        {buttonLabel}
      </button>
    </div>
  );
}
