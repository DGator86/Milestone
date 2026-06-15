"use client";

import { useState, useTransition } from "react";
import { Calendar, Link2, Mail, Plug, Unplug, Check } from "lucide-react";
import {
  disconnectIntegrationAction,
  updateIntegrationServicesAction,
} from "@/app/settings/integrations/actions";
import {
  PROVIDER_LABELS,
} from "@/lib/integrations/config";
import type { ConnectedIntegrationSummary, IntegrationProvider } from "@/lib/integrations/types";

interface ProviderStatus {
  configured: boolean;
}

interface Props {
  initialConnected: ConnectedIntegrationSummary[];
  providers: Record<IntegrationProvider, ProviderStatus>;
  flashMessage?: string | null;
  flashError?: string | null;
}


export default function IntegrationsPanel({
  initialConnected,
  providers,
  flashMessage,
  flashError,
}: Props) {
  const [connected, setConnected] = useState(initialConnected);
  const [message, setMessage] = useState<string | null>(flashMessage ?? null);
  const [error, setError] = useState<string | null>(flashError ?? null);
  const [pending, startTransition] = useTransition();

  function connect(provider: IntegrationProvider) {
    window.location.href = `/api/integrations/${provider}/connect`;
  }

  function disconnect(id: string) {
    startTransition(async () => {
      const result = await disconnectIntegrationAction(id);
      if (result.error) {
        setError(result.error);
        return;
      }
      setConnected((prev) => prev.filter((item) => item.id !== id));
      setMessage("Integration disconnected.");
      setError(null);
    });
  }

  function toggleService(id: string, service: "mail" | "calendar", enabled: boolean) {
    const current = connected.find((item) => item.id === id);
    if (!current) return;
    const next = {
      mail: service === "mail" ? enabled : current.enabledServices.mail,
      calendar: service === "calendar" ? enabled : current.enabledServices.calendar,
    };
    setConnected((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabledServices: next } : item)),
    );
    startTransition(async () => {
      const result = await updateIntegrationServicesAction(id, next.mail, next.calendar);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="ms-card">
      <div className="px-5 py-3.5 border-b border-milestone-line bg-gray-50/60">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
          <Plug size={12} />
          Connected apps
        </p>
      </div>

      <div className="p-5 space-y-4">
        <p className="text-sm text-gray-500">
          Connect Gmail, Google Calendar, Outlook, and Microsoft 365 so you can turn emails and events into goals.
        </p>

        {message && (
          <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <Check size={14} />
            {message}
          </div>
        )}
        {error && (
          <div className="text-xs text-milestone-red bg-red-50 border border-milestone-red/20 rounded-xl px-3 py-2">
            {error}
          </div>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          {(["google", "microsoft"] as IntegrationProvider[]).map((provider) => {
            const configured = providers[provider]?.configured;
            const label = PROVIDER_LABELS[provider];
            const isConnected = connected.some((item) => item.provider === provider);
            return (
              <button
                key={provider}
                type="button"
                disabled={!configured || pending}
                onClick={() => connect(provider)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white hover:border-milestone-blue/30 transition-all text-left disabled:opacity-50"
              >
                <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                  <Link2 size={16} className="text-milestone-blue" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{label}</p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {!configured
                      ? "Not configured on server"
                      : isConnected
                        ? "Connect another account"
                        : "Mail + Calendar"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {connected.length > 0 ? (
          <div className="space-y-3 pt-1">
            {connected.map((item) => (
              <div key={item.id} className="rounded-xl border border-milestone-line p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{PROVIDER_LABELS[item.provider]}</p>
                    <p className="text-xs text-gray-400">{item.accountEmail}</p>
                  </div>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => disconnect(item.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-milestone-red hover:underline disabled:opacity-50"
                  >
                    <Unplug size={12} />
                    Disconnect
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.enabledServices.mail}
                      onChange={(e) => toggleService(item.id, "mail", e.target.checked)}
                      className="accent-milestone-blue"
                    />
                    <Mail size={12} />
                    Mail
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.enabledServices.calendar}
                      onChange={(e) => toggleService(item.id, "calendar", e.target.checked)}
                      className="accent-milestone-blue"
                    />
                    <Calendar size={12} />
                    Calendar
                  </label>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">No accounts connected yet.</p>
        )}
      </div>
    </div>
  );
}
