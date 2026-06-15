import type { IntegrationProvider, IntegrationService } from "./types";

export const INTEGRATION_PROVIDERS: IntegrationProvider[] = ["google", "microsoft"];

export const INTEGRATION_SERVICES: IntegrationService[] = ["mail", "calendar"];

export const PROVIDER_LABELS: Record<IntegrationProvider, string> = {
  google: "Gmail & Google Calendar",
  microsoft: "Outlook & Microsoft 365",
};

export const PROVIDER_SHORT_LABELS: Record<IntegrationProvider, string> = {
  google: "Google",
  microsoft: "Outlook",
};

export const SERVICE_LABELS: Record<IntegrationService, string> = {
  mail: "Mail",
  calendar: "Calendar",
};

export const GOOGLE_INTEGRATION_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/gmail.readonly",
];

export const MICROSOFT_INTEGRATION_SCOPES = [
  "openid",
  "email",
  "profile",
  "offline_access",
  "User.Read",
  "Calendars.Read",
  "Mail.Read",
];

export function isGoogleIntegrationConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
    process.env.GOOGLE_CLIENT_SECRET?.trim()
  );
}

export function isMicrosoftIntegrationConfigured(): boolean {
  return !!(
    process.env.MICROSOFT_CLIENT_ID?.trim() &&
    process.env.MICROSOFT_CLIENT_SECRET?.trim()
  );
}

export function isProviderConfigured(provider: IntegrationProvider): boolean {
  if (provider === "google") return isGoogleIntegrationConfigured();
  if (provider === "microsoft") return isMicrosoftIntegrationConfigured();
  return false;
}

export function defaultEnabledServices(): Record<IntegrationService, boolean> {
  return { mail: true, calendar: true };
}
