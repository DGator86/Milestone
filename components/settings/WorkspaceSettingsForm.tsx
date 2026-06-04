"use client";

import { useActionState, useState } from "react";
import { Building2, Palette, Tags, Check } from "lucide-react";
import { updateWorkspaceSettings } from "@/app/settings/actions";
import { EDITABLE_TERMS, type Terms } from "@/lib/terms";

const INPUT =
  "w-full px-3 py-2 text-sm border border-milestone-line rounded-lg focus:outline-none focus:ring-2 focus:ring-milestone-blue/20 focus:border-milestone-blue bg-white";
const LABEL = "block text-xs font-medium text-gray-500 mb-1";

const SWATCHES = ["#1769FF", "#36A852", "#8B5CF6", "#EA4335", "#F8B400", "#0EA5E9", "#EC4899", "#0F172A"];

interface Props {
  companyName: string | null;
  brandColor: string;
  terms: Terms;
  preferences: Record<string, boolean>;
}

export default function WorkspaceSettingsForm({ companyName, brandColor, terms, preferences }: Props) {
  const [state, action, pending] = useActionState(updateWorkspaceSettings, {} as { error?: string; success?: boolean });
  const [color, setColor] = useState(brandColor);

  return (
    <form action={action} className="space-y-4">
      {/* Workspace identity */}
      <div className="bg-white rounded-xl shadow-card border border-milestone-line overflow-hidden">
        <div className="px-5 py-3.5 border-b border-milestone-line bg-gray-50/60">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
            <Building2 size={12} />
            Workspace
          </p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className={LABEL}>Company / workspace name</label>
            <input name="company_name" defaultValue={companyName ?? ""} placeholder="Acme Corp" maxLength={80} className={INPUT} />
            <p className="text-[11px] text-gray-400 mt-1">Shown in the top navigation in place of “Milestone CRM”.</p>
          </div>
        </div>
      </div>

      {/* Brand color */}
      <div className="bg-white rounded-xl shadow-card border border-milestone-line overflow-hidden">
        <div className="px-5 py-3.5 border-b border-milestone-line bg-gray-50/60">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
            <Palette size={12} />
            Brand color
          </p>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-3 flex-wrap">
            {SWATCHES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setColor(s)}
                aria-label={`Use ${s}`}
                className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${color.toLowerCase() === s.toLowerCase() ? "ring-2 ring-offset-2 ring-gray-400" : ""}`}
                style={{ backgroundColor: s }}
              />
            ))}
            <div className="flex items-center gap-2 ml-1">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-9 h-9 rounded cursor-pointer border border-milestone-line bg-white p-0.5"
                aria-label="Custom color"
              />
              <input
                name="brand_color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-28 px-2.5 py-1.5 text-sm font-mono border border-milestone-line rounded-lg uppercase focus:outline-none focus:ring-2 focus:ring-milestone-blue/20"
              />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Accent used for the logo and highlights.</p>
        </div>
      </div>

      {/* Terminology */}
      <div className="bg-white rounded-xl shadow-card border border-milestone-line overflow-hidden">
        <div className="px-5 py-3.5 border-b border-milestone-line bg-gray-50/60">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
            <Tags size={12} />
            Terminology
          </p>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {EDITABLE_TERMS.map((t) => (
            <div key={t.key}>
              <label className={LABEL}>{t.label}</label>
              <input
                name={`term_${t.key}`}
                defaultValue={terms[t.key]}
                placeholder={t.hint}
                maxLength={40}
                className={INPUT}
              />
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 px-5 pb-4 -mt-1">
          Rename core objects to match your business. Updates the navigation and page headers everywhere.
        </p>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-xl shadow-card border border-milestone-line overflow-hidden">
        <div className="px-5 py-3.5 border-b border-milestone-line bg-gray-50/60">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Preferences</p>
        </div>
        <div className="divide-y divide-milestone-line">
          {[
            { key: "pref_email_notifications", label: "Email notifications", desc: "Get updates on goal progress", checked: preferences.email_notifications },
            { key: "pref_weekly_digest", label: "Weekly digest", desc: "Summary every Monday morning", checked: preferences.weekly_digest },
          ].map((p) => (
            <label key={p.key} className="flex items-center justify-between px-5 py-3.5 cursor-pointer">
              <div>
                <p className="text-sm font-medium text-gray-700">{p.label}</p>
                <p className="text-xs text-gray-400">{p.desc}</p>
              </div>
              <input type="checkbox" name={p.key} defaultChecked={p.checked} className="w-4 h-4 accent-milestone-blue cursor-pointer" />
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 sticky bottom-0 bg-milestone-bg/80 backdrop-blur py-2">
        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2.5 bg-milestone-blue text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        {state?.success && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-milestone-green">
            <Check size={15} /> Saved
          </span>
        )}
        {state?.error && <span className="text-sm font-medium text-milestone-red">{state.error}</span>}
      </div>
    </form>
  );
}
