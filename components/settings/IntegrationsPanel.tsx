"use client";

import { useState, useTransition } from "react";
import { Calendar, Link2, Mail, Plug, Unplug, Check } from "lucide-react";
import {
  disconnectIntegrationAction,
  updateIntegrationServicesAction,
} from "@/app/settings/integrations/actions";
import {
  PROVIDER_LABELS,
  PROVIDER_SHORT_LABELS,
} from "@/lib/integrations/config";
import type { ConnectedIntegrationSummary, IntegrationProvider } from "@/lib/integrations/types";

interface ProviderStatus {
  configured: boolean;
}

interface Props {
  initialConnected: ConnectedIntegrationSummary[];
  providers: Record<IntegrationProvider, ProviderStatus>;
  redirectUris: Record<IntegrationProvider, string>;
  flashMessage?: string | null;
  flashError?: string | null;
}


export default function IntegrationsPanel({
  initialConnected,
  providers,
  redirectUris,
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
            const shortLabel = PROVIDER_SHORT_LABELS[provider];
            const isConnected = connected.some((item) => item.provider === provider);
            const redirectUri = redirectUris[provider];
            return (
              <div key={provider} className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                    <Link2 size={16} className="text-milestone-blue" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800">{label}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {configured
                        ? isConnected
                          ? "Connect another account"
                          : "Read mail and calendar to create goals"
                        : "Server credentials not set yet"}
                    </p>
                  </div>
                </div>

                {configured ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => connect(provider)}
                    className="w-full px-3 py-2 rounded-lg bg-milestone-blue text-white text-xs font-semibold hover:bg-blue-600 disabled:opacity-50 transition-colors"
                  >
                    Connect {shortLabel}
                  </button>
                ) : (
                  <div className="text-[11px] text-gray-500 bg-white border border-gray-200 rounded-lg p-3 space-y-1.5">
                    <p className="font-semibold text-gray-700">Setup required</p>
                    {provider === "google" ? (
                      <>
                        <p>Add redirect URI in Google Cloud Console:</p>
                        <code className="block text-[10px] break-all text-milestone-blue">{redirectUri}</code>
                        <p>Enable Gmail API + Calendar API. Uses existing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET.</p>
                      </>
                    ) : (
                      <>
                        <p>Register an app in Microsoft Entra ID (Azure), then set:</p>
                        <code className="block text-[10px] text-gray-600">MICROSOFT_CLIENT_ID</code>
                        <code className="block text-[10px] text-gray-600">MICROSOFT_CLIENT_SECRET</code>
                        <p>Redirect URI (Web platform):</p>
                        <code className="block text-[10px] break-all text-milestone-blue">{redirectUri}</code>
                        <p>Permissions: Mail.Read, Calendars.Read, offline_access, User.Read</p>
                      </>
                    )}
                  </div>
                )}
              </div>
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
