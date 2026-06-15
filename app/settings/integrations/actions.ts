"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import { disconnectIntegration, updateIntegrationServices } from "@/lib/integrations/store";
import type { IntegrationService } from "@/lib/integrations/types";

export async function disconnectIntegrationAction(integrationId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in" };

  const ok = await disconnectIntegration(await getDataOwnerId(), integrationId);
  if (!ok) return { error: "Integration not found" };

  revalidatePath("/settings");
  return { success: true };
}

export async function updateIntegrationServicesAction(
  integrationId: string,
  mail: boolean,
  calendar: boolean,
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in" };

  const enabledServices: Record<IntegrationService, boolean> = { mail, calendar };
  const ok = await updateIntegrationServices(await getDataOwnerId(), integrationId, enabledServices);
  if (!ok) return { error: "Integration not found" };

  revalidatePath("/settings");
  return { success: true };
}
