import { getSiteUrl } from "@/lib/site-url";
import type { IntegrationProvider } from "./types";

export function integrationRedirectUri(provider: IntegrationProvider): string {
  const override = provider === "google"
    ? process.env.GOOGLE_INTEGRATION_REDIRECT_URI?.trim()
    : process.env.MICROSOFT_INTEGRATION_REDIRECT_URI?.trim();
  if (override) return override.replace(/\/+$/, "");
  return `${getSiteUrl()}/api/integrations/${provider}/callback`;
}

/** NextAuth Google sign-in callback — usually already registered in Google Cloud. */
export function googleLoginRedirectUri(): string {
  return `${getSiteUrl()}/api/auth/callback/google`;
}

export const GOOGLE_CLOUD_CREDENTIALS_URL =
  "https://console.cloud.google.com/apis/credentials";

export const GOOGLE_API_LIBRARY_URL =
  "https://console.cloud.google.com/apis/library";

export const MICROSOFT_APP_REGISTRATIONS_URL =
  "https://entra.microsoft.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps";
