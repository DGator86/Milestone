import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import { listConnectedIntegrations } from "@/lib/integrations/store";
import {
  isGoogleIntegrationConfigured,
  isMicrosoftIntegrationConfigured,
} from "@/lib/integrations/config";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = await getDataOwnerId();
  const connected = await listConnectedIntegrations(userId);

  return NextResponse.json({
    connected,
    providers: {
      google: { configured: isGoogleIntegrationConfigured() },
      microsoft: { configured: isMicrosoftIntegrationConfigured() },
    },
  });
}
