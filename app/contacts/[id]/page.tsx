import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";
import LogTouchForm from "@/components/contacts/LogTouchForm";
import { Phone, Mail, Building2, User, Clock, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import type { Touch, TouchType } from "@/lib/types";

export const dynamic = "force-dynamic";

const TOUCH_ICONS: Record<TouchType, string> = {
  call: "📞",
  email: "✉️",
  meeting: "🤝",
  note: "📝",
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelative(date: string) {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

function TouchHealthBanner({ lastTouchedAt, frequencyDays }: { lastTouchedAt: string | null; frequencyDays: number | null }) {
  if (!frequencyDays) return null;

  const daysSince = lastTouchedAt
    ? Math.floor((Date.now() - new Date(lastTouchedAt).getTime()) / 86400000)
    : null;

  const isOverdue = daysSince === null || daysSince >= frequencyDays;
  const isDueSoon = !isOverdue && daysSince >= frequencyDays * 0.75;

  if (!isOverdue && !isDueSoon) return null;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-4 ${isOverdue ? "bg-milestone-red-dim" : "bg-milestone-amber-dim"}`}>
      <AlertCircle size={16} className={isOverdue ? "text-milestone-red shrink-0" : "text-milestone-amber shrink-0"} />
      <p className={`text-sm font-semibold ${isOverdue ? "text-milestone-red" : "text-milestone-amber"}`}>
        {isOverdue
          ? daysSince === null
            ? "Never touched — time to reach out"
            : `${daysSince - frequencyDays} days overdue for a touch`
          : `Due for a touch in ${frequencyDays - daysSince!} days`}
      </p>
    </div>
  );
}

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: contact }, { data: touchesRaw }] = await Promise.all([
    supabase
      .from("contacts")
      .select("*, groups(*)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("touches")
      .select("*")
      .eq("contact_id", id)
      .order("touched_at", { ascending: false })
      .limit(50),
  ]);

  if (!contact) notFound();

  const touches: Touch[] = touchesRaw ?? [];

  const avatarColors = [
    "from-blue-500 to-blue-600", "from-purple-500 to-purple-600",
    "from-green-500 to-green-600", "from-orange-500 to-orange-600",
  ];
  const gradientColor = avatarColors[contact.name.charCodeAt(0) % avatarColors.length];
  const initials = contact.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <AppShell user={user}>
      <div className="p-4 md:p-6 max-w-2xl">
        {/* Back */}
        <Link
          href="/contacts"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors mb-4"
        >
          <ArrowLeft size={13} />
          Contacts
        </Link>

        {/* Contact header */}
        <div className="bg-white rounded-xl border border-milestone-line shadow-card p-6 mb-4">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradientColor} flex items-center justify-center shrink-0`}>
              <span className="text-white text-lg font-bold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 leading-tight">{contact.name}</h1>
              {(contact.role || contact.company) && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {[contact.role, contact.company].filter(Boolean).join(" · ")}
                </p>
              )}
              <div className="flex flex-wrap gap-3 mt-3">
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-xs text-milestone-blue hover:underline">
                    <Mail size={12} />
                    {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700">
                    <Phone size={12} />
                    {contact.phone}
                  </a>
                )}
                {contact.groups && (
                  <span className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Building2 size={12} />
                    {contact.groups.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {contact.touch_frequency_days && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-milestone-line">
              <Clock size={13} className="text-gray-400 shrink-0" />
              <span className="text-xs text-gray-500">
                Touch every <strong>{contact.touch_frequency_days} days</strong>
                {contact.last_touched_at && (
                  <> · Last: {formatRelative(contact.last_touched_at)}</>
                )}
              </span>
            </div>
          )}

          {contact.notes && (
            <div className="mt-4 pt-4 border-t border-milestone-line">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <User size={11} /> Notes
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">{contact.notes}</p>
            </div>
          )}
        </div>

        {/* Overdue banner */}
        <TouchHealthBanner
          lastTouchedAt={contact.last_touched_at}
          frequencyDays={contact.touch_frequency_days}
        />

        {/* Log touch */}
        <div className="mb-4">
          <LogTouchForm contactId={id} />
        </div>

        {/* Touch history */}
        <div>
          <h2 className="text-[13px] font-bold uppercase tracking-widest text-gray-400 mb-3">
            Touch History
          </h2>
          {touches.length === 0 ? (
            <div className="bg-white rounded-xl border border-milestone-line p-10 text-center">
              <p className="text-sm text-gray-400">No touches logged yet.</p>
              <p className="text-xs text-gray-300 mt-1">Log your first interaction above.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-milestone-line overflow-hidden shadow-card">
              {touches.map((touch) => (
                <div
                  key={touch.id}
                  className="flex items-start gap-3 px-5 py-4 border-b border-milestone-line last:border-0"
                >
                  <span className="text-xl shrink-0 mt-0.5">{TOUCH_ICONS[touch.type]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-700 capitalize">{touch.type}</span>
                      <span className="text-gray-200 text-xs">·</span>
                      <span className="text-xs text-gray-400">{formatDate(touch.touched_at)}</span>
                    </div>
                    {touch.notes && (
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">{touch.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
