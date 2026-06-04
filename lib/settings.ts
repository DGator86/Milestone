import { cache } from "react";
import { db } from "@/db";
import { user_settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { DEFAULT_TERMS, type Terms } from "./terms";

export interface WorkspaceSettings {
  companyName: string | null;
  brandColor: string;
  terms: Terms;
  preferences: Record<string, boolean>;
}

const DEFAULT_BRAND = "#1769FF";

export const getSettings = cache(async (userId: string): Promise<WorkspaceSettings> => {
  let row;
  try {
    row = await db.query.user_settings.findFirst({ where: eq(user_settings.user_id, userId) });
  } catch {
    // Table may not exist yet (migration not applied) — fall back to defaults.
    row = undefined;
  }
  return {
    companyName: row?.company_name ?? null,
    brandColor: row?.brand_color ?? DEFAULT_BRAND,
    terms: { ...DEFAULT_TERMS, ...((row?.terminology as Partial<Terms>) ?? {}) },
    preferences: (row?.preferences as Record<string, boolean>) ?? {},
  };
});
