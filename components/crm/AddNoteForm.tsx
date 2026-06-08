"use client";

import { useState, useTransition } from "react";
import { addCrmNote } from "@/app/crm/notes-actions";

export default function AddNoteForm({
  contactId,
  customerId,
  goalId,
  opportunityId,
  onDone,
}: {
  contactId?: string;
  customerId?: string;
  goalId?: string;
  opportunityId?: string;
  onDone?: () => void;
}) {
  const [body, setBody] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-milestone-blue hover:underline"
      >
        + Add a note
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!body.trim()) return;
        const fd = new FormData();
        fd.set("body", body.trim());
        if (contactId) fd.set("contact_id", contactId);
        if (customerId) fd.set("customer_id", customerId);
        if (goalId) fd.set("goal_id", goalId);
        if (opportunityId) fd.set("opportunity_id", opportunityId);
        startTransition(async () => {
          await addCrmNote(fd);
          setBody("");
          setOpen(false);
          onDone?.();
        });
      }}
      className="space-y-2"
    >
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Call summary, lunch prep, next steps…"
        rows={3}
        autoFocus
        className="w-full px-3 py-2 text-sm border border-milestone-line rounded-xl focus:outline-none focus:ring-2 focus:ring-milestone-blue/20 resize-none"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending || !body.trim()}
          className="px-3 py-1.5 bg-milestone-blue text-white text-xs font-semibold rounded-lg disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save note"}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setBody(""); }}
          className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
