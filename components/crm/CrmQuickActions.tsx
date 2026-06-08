"use client";

import { Target, Handshake, StickyNote, Mail } from "lucide-react";
import { prefillNewGoal, prefillNewOpportunity } from "@/lib/crm/prefill";

export default function CrmQuickActions({
  contactId,
  customerId,
  contactName,
  customerName,
  email,
  onAddNote,
}: {
  contactId?: string;
  customerId?: string;
  contactName?: string;
  customerName?: string;
  email?: string | null;
  onAddNote?: () => void;
}) {
  const goalTitle =
    contactName && customerName
      ? `Follow up with ${contactName} @ ${customerName}`
      : contactName
        ? `Follow up with ${contactName}`
        : customerName
          ? `Work ${customerName} account`
          : undefined;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() =>
          prefillNewGoal({
            title: goalTitle,
            customer_id: customerId,
            crm_contact_id: contactId,
          })
        }
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-milestone-blue bg-milestone-blue-dim hover:bg-blue-100 rounded-lg transition-colors"
      >
        <Target size={13} />
        Create goal
      </button>
      <button
        type="button"
        onClick={() =>
          prefillNewOpportunity({
            customer_id: customerId,
            contact_id: contactId,
            title: customerName ? `${customerName} — ` : "",
          })
        }
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-milestone-green bg-milestone-green-dim hover:bg-green-100 rounded-lg transition-colors"
      >
        <Handshake size={13} />
        New opportunity
      </button>
      {onAddNote && (
        <button
          type="button"
          onClick={onAddNote}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <StickyNote size={13} />
          Add note
        </button>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <Mail size={13} />
          Email
        </a>
      )}
    </div>
  );
}
