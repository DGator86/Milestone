import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import { fetchIntegrationItems } from "@/lib/integrations/fetch-items";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await fetchIntegrationItems(await getDataOwnerId());
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load integration items";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
