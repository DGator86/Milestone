import { getConnectedIntegrations, getValidAccessToken } from "./store";
import { fetchGoogleItems, fetchMicrosoftItems } from "./providers";
import type { IntegrationItem } from "./types";

export async function fetchIntegrationItems(userId: string): Promise<IntegrationItem[]> {
  const integrations = await getConnectedIntegrations(userId);
  const items: IntegrationItem[] = [];

  for (const integration of integrations) {
    try {
      const accessToken = await getValidAccessToken(integration);
      const fetched =
        integration.provider === "google"
          ? await fetchGoogleItems(integration, accessToken)
          : await fetchMicrosoftItems(integration, accessToken);
      items.push(...fetched);
    } catch {
      // Skip integrations that fail to refresh or fetch.
    }
  }

  return items.sort((a, b) => {
    if (a.date && b.date) return a.date.localeCompare(b.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return a.title.localeCompare(b.title);
  });
}
