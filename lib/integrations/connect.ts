import { getSiteUrl } from "@/lib/site-url";
import {
  GOOGLE_INTEGRATION_SCOPES,
  MICROSOFT_INTEGRATION_SCOPES,
  isProviderConfigured,
} from "./config";
import { createOAuthState } from "./oauth-state";
import type { IntegrationProvider } from "./types";

export function integrationRedirectUri(provider: IntegrationProvider): string {
  return `${getSiteUrl()}/api/integrations/${provider}/callback`;
}

export function buildGoogleConnectUrl(userId: string): string | null {
  if (!isProviderConfigured("google")) return null;
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: integrationRedirectUri("google"),
    response_type: "code",
    scope: GOOGLE_INTEGRATION_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state: createOAuthState(userId, "google"),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export function buildMicrosoftConnectUrl(userId: string): string | null {
  if (!isProviderConfigured("microsoft")) return null;
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    redirect_uri: integrationRedirectUri("microsoft"),
    response_type: "code",
    scope: MICROSOFT_INTEGRATION_SCOPES.join(" "),
    response_mode: "query",
    state: createOAuthState(userId, "microsoft"),
  });
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`;
}

export function buildConnectUrl(provider: IntegrationProvider, userId: string): string | null {
  if (provider === "google") return buildGoogleConnectUrl(userId);
  if (provider === "microsoft") return buildMicrosoftConnectUrl(userId);
  return null;
}
