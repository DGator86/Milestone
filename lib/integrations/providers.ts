import type { IntegrationItem } from "./types";
import type { StoredIntegration } from "./store";

function decodeBase64Url(data: string): string {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return Buffer.from(normalized, "base64").toString("utf8");
  } catch {
    return "";
  }
}

function stripHtml(input: string): string {
  return input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function toDateKey(iso?: string | null): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

export async function fetchGoogleItems(
  integration: StoredIntegration,
  accessToken: string,
): Promise<IntegrationItem[]> {
  const items: IntegrationItem[] = [];
  const services = integration.enabledServices;

  if (services.calendar !== false) {
    const now = new Date();
    const later = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const params = new URLSearchParams({
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "15",
      timeMin: now.toISOString(),
      timeMax: later.toISOString(),
    });
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      const data = (await res.json()) as {
        items?: Array<{
          id?: string;
          summary?: string;
          description?: string;
          start?: { dateTime?: string; date?: string };
          htmlLink?: string;
        }>;
      };
      for (const event of data.items ?? []) {
        if (!event.id || !event.summary) continue;
        items.push({
          id: `google:calendar:${event.id}`,
          provider: "google",
          service: "calendar",
          title: event.summary,
          snippet: event.description?.slice(0, 240),
          date: toDateKey(event.start?.dateTime ?? event.start?.date),
          url: event.htmlLink,
          accountEmail: integration.accountEmail,
        });
      }
    }
  }

  if (services.mail !== false) {
    const res = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=15&q=in:inbox newer_than:30d",
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (res.ok) {
      const list = (await res.json()) as { messages?: Array<{ id: string }> };
      for (const message of (list.messages ?? []).slice(0, 10)) {
        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        if (!detailRes.ok) continue;
        const detail = (await detailRes.json()) as {
          id: string;
          snippet?: string;
          payload?: { headers?: Array<{ name?: string; value?: string }> };
        };
        const subject = detail.payload?.headers?.find((h) => h.name === "Subject")?.value ?? "(No subject)";
        const from = detail.payload?.headers?.find((h) => h.name === "From")?.value;
        items.push({
          id: `google:mail:${detail.id}`,
          provider: "google",
          service: "mail",
          title: subject,
          snippet: from ? `From: ${from}${detail.snippet ? ` — ${detail.snippet}` : ""}` : detail.snippet,
          url: `https://mail.google.com/mail/u/0/#inbox/${detail.id}`,
          accountEmail: integration.accountEmail,
        });
      }
    }
  }

  return items;
}

export async function fetchMicrosoftItems(
  integration: StoredIntegration,
  accessToken: string,
): Promise<IntegrationItem[]> {
  const items: IntegrationItem[] = [];
  const services = integration.enabledServices;

  if (services.calendar !== false) {
    const now = new Date();
    const later = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const params = new URLSearchParams({
      $top: "15",
      $orderby: "start/dateTime",
      $filter: `start/dateTime ge '${now.toISOString()}' and start/dateTime le '${later.toISOString()}'`,
      $select: "id,subject,bodyPreview,start,end,webLink",
    });
    const res = await fetch(`https://graph.microsoft.com/v1.0/me/events?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      const data = (await res.json()) as {
        value?: Array<{
          id?: string;
          subject?: string;
          bodyPreview?: string;
          start?: { dateTime?: string };
          webLink?: string;
        }>;
      };
      for (const event of data.value ?? []) {
        if (!event.id || !event.subject) continue;
        items.push({
          id: `microsoft:calendar:${event.id}`,
          provider: "microsoft",
          service: "calendar",
          title: event.subject,
          snippet: event.bodyPreview?.slice(0, 240),
          date: toDateKey(event.start?.dateTime),
          url: event.webLink,
          accountEmail: integration.accountEmail,
        });
      }
    }
  }

  if (services.mail !== false) {
    const params = new URLSearchParams({
      $top: "15",
      $orderby: "receivedDateTime desc",
      $select: "id,subject,bodyPreview,from,receivedDateTime,webLink",
    });
    const res = await fetch(`https://graph.microsoft.com/v1.0/me/messages?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      const data = (await res.json()) as {
        value?: Array<{
          id?: string;
          subject?: string;
          bodyPreview?: string;
          from?: { emailAddress?: { name?: string; address?: string } };
          webLink?: string;
        }>;
      };
      for (const message of data.value ?? []) {
        if (!message.id || !message.subject) continue;
        const from = message.from?.emailAddress;
        const fromLabel = from?.name ?? from?.address;
        items.push({
          id: `microsoft:mail:${message.id}`,
          provider: "microsoft",
          service: "mail",
          title: message.subject,
          snippet: fromLabel ? `From: ${fromLabel}${message.bodyPreview ? ` — ${message.bodyPreview}` : ""}` : message.bodyPreview,
          url: message.webLink,
          accountEmail: integration.accountEmail,
        });
      }
    }
  }

  return items;
}

export function parseIntegrationItemId(id: string): {
  provider: "google" | "microsoft";
  service: "mail" | "calendar";
  externalId: string;
} | null {
  const [provider, service, ...rest] = id.split(":");
  const externalId = rest.join(":");
  if ((provider !== "google" && provider !== "microsoft") || (service !== "mail" && service !== "calendar") || !externalId) {
    return null;
  }
  return { provider, service, externalId };
}

export function cleanSnippet(snippet?: string): string {
  if (!snippet) return "";
  return stripHtml(decodeBase64Url(snippet)).slice(0, 500);
}
