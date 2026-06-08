import Link from "next/link";
import type { TimelineEntry } from "@/lib/crm/timeline";

function formatWhen(dateStr: string) {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ActivityTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (!entries.length) {
    return <p className="text-sm text-gray-400 text-center py-4">No activity yet.</p>;
  }

  return (
    <div className="space-y-0 divide-y divide-milestone-line">
      {entries.map((e) => {
        const inner = (
          <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <div
              className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                e.kind === "note" ? "bg-milestone-amber" : "bg-milestone-blue"
              }`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-gray-700">{e.label}</p>
                <span className="text-[10px] text-gray-400 shrink-0 tabular-nums">{formatWhen(e.created_at)}</span>
              </div>
              {e.detail && (
                <p className="text-sm text-gray-600 mt-0.5 leading-relaxed whitespace-pre-wrap">{e.detail}</p>
              )}
            </div>
          </div>
        );
        return e.href ? (
          <Link key={e.id} href={e.href} className="block hover:bg-gray-50/80 -mx-2 px-2 rounded-lg transition-colors">
            {inner}
          </Link>
        ) : (
          <div key={e.id}>{inner}</div>
        );
      })}
    </div>
  );
}
