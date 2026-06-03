#!/usr/bin/env node
/**
 * Verifies .env.local and that the Supabase project responds (auth health).
 * Run: npm run verify
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env.local");

function parseEnv(content) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const line of content.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

async function main() {
  if (!fs.existsSync(envPath)) {
    console.error("Missing .env.local");
    console.error("  cp .env.example .env.local");
    console.error("  Then add your Supabase Project URL and anon (public) key.");
    process.exit(1);
  }

  const env = parseEnv(fs.readFileSync(envPath, "utf8"));
  const url = (env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const key = (env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

  if (!url || !key) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
    process.exit(1);
  }

  if (
    url === "your_supabase_project_url" ||
    key === "your_supabase_anon_key" ||
    url.includes("your-project")
  ) {
    console.error(".env.local still has placeholder values — use real Supabase credentials.");
    process.exit(1);
  }

  let base;
  try {
    base = new URL(url);
  } catch {
    console.error("NEXT_PUBLIC_SUPABASE_URL is not a valid URL");
    process.exit(1);
  }

  if (!base.hostname.endsWith("supabase.co")) {
    console.warn("Warning: host does not end with supabase.co (custom domains are fine if intentional).");
  }

  if (process.env.VERIFY_SKIP_HEALTH === "1") {
    console.log("OK — .env.local has non-placeholder URL and key (VERIFY_SKIP_HEALTH=1, skipped live check).");
  } else {
    const healthUrl = `${base.origin.replace(/\/$/, "")}/auth/v1/health`;
    const res = await fetch(healthUrl, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });

    if (!res.ok) {
      console.error(`Supabase did not accept this URL/key (GET /auth/v1/health → ${res.status}).`);
      console.error("Check Project Settings → API, and that the project is not paused.");
      console.error("If your dashboard shows a different key type, you can run: VERIFY_SKIP_HEALTH=1 npm run verify");
      process.exit(1);
    }
    console.log("OK — Supabase URL and anon key work, and auth endpoint responded.");
  }
  console.log("");
  console.log("If you have not already, run supabase/schema.sql in the Supabase SQL Editor.");
  console.log("Then: npm run dev  →  http://localhost:3000");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
