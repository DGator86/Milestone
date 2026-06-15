"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, Loader, Mail, Plug, Sparkles } from "lucide-react";
import { integrationItemToGoalPrefill } from "@/lib/integrations/goal-prefill";
import { PROVIDER_LABELS, SERVICE_LABELS } from "@/lib/integrations/config";
import type { IntegrationItem } from "@/lib/integrations/types";

interface Props {
  onSelect: (prefill: ReturnType<typeof integrationItemToGoalPrefill>) => void;
  onConnectApps?: () => void;
}

export default function IntegrationItemPicker({ onSelect, onConnectApps }: Props) {
  const [items, setItems] = useState<IntegrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "mail" | "calendar">("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/integrations/items")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load items");
        if (!cancelled) setItems(data.items ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load items");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => item.service === filter);
  }, [items, filter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-400">
        <Loader size={20} className="animate-spin mb-2" />
        <p className="text-xs">Loading from your connected apps…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 px-4">
        <p className="text-sm text-milestone-red">{error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <div className="w-11 h-11 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
          <Plug size={20} className="text-gray-400" />
        </div>
        <p className="text-sm font-semibold text-gray-700">Connect your apps first</p>
        <p className="text-xs text-gray-400 mt-1 max-w-[240px]">
          Link Google or Microsoft in Settings, then pick emails and calendar events to turn into goals.
        </p>
        {onConnectApps && (
          <button
            type="button"
            onClick={onConnectApps}
            className="mt-4 text-xs font-semibold text-milestone-blue hover:underline"
          >
            Open Settings →
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {(["all", "mail", "calendar"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
              filter === value
                ? "bg-milestone-blue text-white border-milestone-blue"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
            }`}
          >
            {value === "all" ? "All" : SERVICE_LABELS[value]}
          </button>
        ))}
      </div>

      <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
        {filtered.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(integrationItemToGoalPrefill(item))}
            className="w-full text-left rounded-xl border border-gray-200 hover:border-milestone-blue/40 hover:bg-milestone-blue-dim/40 transition-all p-3"
          >
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                {item.service === "mail" ? (
                  <Mail size={13} className="text-milestone-blue" />
                ) : (
                  <Calendar size={13} className="text-milestone-amber" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 truncate">{item.title}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {PROVIDER_LABELS[item.provider]} · {item.accountEmail}
                  {item.date ? ` · ${item.date}` : ""}
                </p>
                {item.snippet && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.snippet}</p>
                )}
              </div>
              <Sparkles size={14} className="text-milestone-blue shrink-0 mt-1" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
