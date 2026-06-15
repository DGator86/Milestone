import { db } from "@/db";
import { connected_integrations } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import {
  GOOGLE_INTEGRATION_SCOPES,
  MICROSOFT_INTEGRATION_SCOPES,
  defaultEnabledServices,
  isProviderConfigured,
} from "./config";
import type { ConnectedIntegrationSummary, IntegrationProvider } from "./types";

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
}

interface StoredIntegration {
  id: string;
  userId: string;
  provider: IntegrationProvider;
  accountEmail: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
  scopes: string[];
  enabledServices: Record<string, boolean>;
}

function parseScopes(scope?: string): string[] {
  if (!scope) return [];
  return scope.split(/\s+/).filter(Boolean);
}

function expiresAtFromNow(seconds?: number): string | null {
  if (!seconds || seconds <= 0) return null;
  return new Date(Date.now() + seconds * 1000).toISOString();
}

function rowToStored(row: typeof connected_integrations.$inferSelect): StoredIntegration {
  return {
    id: row.id,
    userId: row.user_id,
    provider: row.provider as IntegrationProvider,
    accountEmail: row.account_email,
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    expiresAt: row.expires_at,
    scopes: row.scopes ?? [],
    enabledServices: row.enabled_services ?? defaultEnabledServices(),
  };
}

async function refreshGoogleToken(refreshToken: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error("Failed to refresh Google token");
  return res.json() as Promise<TokenResponse>;
}

async function refreshMicrosoftToken(refreshToken: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    scope: MICROSOFT_INTEGRATION_SCOPES.join(" "),
  });
  const res = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error("Failed to refresh Microsoft token");
  return res.json() as Promise<TokenResponse>;
}

export async function listConnectedIntegrations(userId: string): Promise<ConnectedIntegrationSummary[]> {
  const rows = await db.query.connected_integrations.findMany({
    where: eq(connected_integrations.user_id, userId),
    orderBy: (t, { asc }) => [asc(t.provider), asc(t.account_email)],
  });

  return rows.map((row) => ({
    id: row.id,
    provider: row.provider as IntegrationProvider,
    accountEmail: row.account_email,
    enabledServices: {
      mail: row.enabled_services?.mail !== false,
      calendar: row.enabled_services?.calendar !== false,
    },
    connectedAt: row.created_at,
  }));
}

export async function getConnectedIntegrations(userId: string): Promise<StoredIntegration[]> {
  const rows = await db.query.connected_integrations.findMany({
    where: eq(connected_integrations.user_id, userId),
  });
  return rows.map(rowToStored);
}

export async function disconnectIntegration(userId: string, integrationId: string): Promise<boolean> {
  const deleted = await db
    .delete(connected_integrations)
    .where(and(eq(connected_integrations.user_id, userId), eq(connected_integrations.id, integrationId)))
    .returning({ id: connected_integrations.id });
  return deleted.length > 0;
}

export async function updateIntegrationServices(
  userId: string,
  integrationId: string,
  enabledServices: Record<string, boolean>,
): Promise<boolean> {
  const updated = await db
    .update(connected_integrations)
    .set({ enabled_services: enabledServices, updated_at: new Date().toISOString() })
    .where(and(eq(connected_integrations.user_id, userId), eq(connected_integrations.id, integrationId)))
    .returning({ id: connected_integrations.id });
  return updated.length > 0;
}

async function upsertIntegration(
  userId: string,
  provider: IntegrationProvider,
  accountEmail: string,
  tokens: TokenResponse,
  scopes: string[],
): Promise<void> {
  const existing = await db.query.connected_integrations.findFirst({
    where: and(
      eq(connected_integrations.user_id, userId),
      eq(connected_integrations.provider, provider),
      eq(connected_integrations.account_email, accountEmail),
    ),
  });

  const values = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? existing?.refresh_token ?? null,
    expires_at: expiresAtFromNow(tokens.expires_in),
    scopes,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    await db.update(connected_integrations).set(values).where(eq(connected_integrations.id, existing.id));
    return;
  }

  await db.insert(connected_integrations).values({
    user_id: userId,
    provider,
    account_email: accountEmail,
    ...values,
    enabled_services: defaultEnabledServices(),
  });
}

async function fetchGoogleProfile(accessToken: string): Promise<string> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to load Google profile");
  const data = (await res.json()) as { email?: string };
  if (!data.email) throw new Error("Google account email missing");
  return data.email;
}

async function fetchMicrosoftProfile(accessToken: string): Promise<string> {
  const res = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to load Microsoft profile");
  const data = (await res.json()) as { mail?: string; userPrincipalName?: string };
  const email = data.mail ?? data.userPrincipalName;
  if (!email) throw new Error("Microsoft account email missing");
  return email;
}

export async function exchangeGoogleCode(code: string, redirectUri: string, userId: string): Promise<void> {
  if (!isProviderConfigured("google")) throw new Error("Google integration is not configured");

  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error("Google authorization failed");
  const tokens = (await res.json()) as TokenResponse;
  const email = await fetchGoogleProfile(tokens.access_token);
  const scopes = parseScopes(tokens.scope).length ? parseScopes(tokens.scope) : GOOGLE_INTEGRATION_SCOPES;
  await upsertIntegration(userId, "google", email, tokens, scopes);
}

export async function exchangeMicrosoftCode(code: string, redirectUri: string, userId: string): Promise<void> {
  if (!isProviderConfigured("microsoft")) throw new Error("Microsoft integration is not configured");

  const body = new URLSearchParams({
    code,
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
    scope: MICROSOFT_INTEGRATION_SCOPES.join(" "),
  });
  const res = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error("Microsoft authorization failed");
  const tokens = (await res.json()) as TokenResponse;
  const email = await fetchMicrosoftProfile(tokens.access_token);
  const scopes = parseScopes(tokens.scope).length ? parseScopes(tokens.scope) : MICROSOFT_INTEGRATION_SCOPES;
  await upsertIntegration(userId, "microsoft", email, tokens, scopes);
}

export async function getValidAccessToken(integration: StoredIntegration): Promise<string> {
  const expiresSoon =
    integration.expiresAt &&
    new Date(integration.expiresAt).getTime() - Date.now() < 60_000;

  if (!expiresSoon) return integration.accessToken;
  if (!integration.refreshToken) return integration.accessToken;

  const refreshed =
    integration.provider === "google"
      ? await refreshGoogleToken(integration.refreshToken)
      : await refreshMicrosoftToken(integration.refreshToken);

  await db
    .update(connected_integrations)
    .set({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token ?? integration.refreshToken,
      expires_at: expiresAtFromNow(refreshed.expires_in),
      updated_at: new Date().toISOString(),
    })
    .where(eq(connected_integrations.id, integration.id));

  return refreshed.access_token;
}

export type { StoredIntegration };
