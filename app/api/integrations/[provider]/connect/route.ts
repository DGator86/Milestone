import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import { buildConnectUrl } from "@/lib/integrations/connect";
import { isProviderConfigured } from "@/lib/integrations/config";
import type { IntegrationProvider } from "@/lib/integrations/types";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { provider: rawProvider } = await params;
  const provider = rawProvider as IntegrationProvider;
  if (provider !== "google" && provider !== "microsoft") {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  if (!isProviderConfigured(provider)) {
    return NextResponse.json({ error: `${provider} integration is not configured` }, { status: 503 });
  }

  const url = buildConnectUrl(provider, await getDataOwnerId());
  if (!url) {
    return NextResponse.json({ error: "Could not start connection" }, { status: 500 });
  }

  return NextResponse.redirect(url);
}
