import { NextRequest, NextResponse } from "next/server";
import { verifyOAuthState } from "@/lib/integrations/oauth-state";
import { exchangeGoogleCode, exchangeMicrosoftCode } from "@/lib/integrations/store";
import { integrationRedirectUri } from "@/lib/integrations/connect";
import type { IntegrationProvider } from "@/lib/integrations/types";

export const runtime = "nodejs";

function settingsRedirect(req: NextRequest, params: Record<string, string>) {
  const url = new URL("/settings", req.url);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: rawProvider } = await params;
  const provider = rawProvider as IntegrationProvider;
  if (provider !== "google" && provider !== "microsoft") {
    return settingsRedirect(req, { integration_error: "invalid_provider" });
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const oauthError = req.nextUrl.searchParams.get("error");

  if (oauthError) {
    return settingsRedirect(req, { integration_error: oauthError });
  }
  if (!code || !state) {
    return settingsRedirect(req, { integration_error: "missing_code" });
  }

  const verified = verifyOAuthState(state);
  if (!verified || verified.provider !== provider) {
    return settingsRedirect(req, { integration_error: "invalid_state" });
  }

  try {
    const redirectUri = integrationRedirectUri(provider);
    if (provider === "google") {
      await exchangeGoogleCode(code, redirectUri, verified.userId);
    } else {
      await exchangeMicrosoftCode(code, redirectUri, verified.userId);
    }
    return settingsRedirect(req, { integration_connected: provider });
  } catch {
    return settingsRedirect(req, { integration_error: "exchange_failed" });
  }
}
