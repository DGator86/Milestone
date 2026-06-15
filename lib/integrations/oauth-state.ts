import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { getAuthSecret } from "@/lib/auth-env";
import type { IntegrationProvider } from "./types";

const STATE_TTL_MS = 10 * 60 * 1000;

function sign(payload: string): string {
  const secret = getAuthSecret();
  if (!secret) throw new Error("AUTH_SECRET is required for integration OAuth");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createOAuthState(userId: string, provider: IntegrationProvider): string {
  const nonce = randomBytes(16).toString("hex");
  const issuedAt = Date.now();
  const payload = `${userId}:${provider}:${issuedAt}:${nonce}`;
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
}

export function verifyOAuthState(state: string): { userId: string; provider: IntegrationProvider } | null {
  const [encoded, signature] = state.split(".");
  if (!encoded || !signature) return null;

  let payload: string;
  try {
    payload = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const expected = sign(payload);
  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  const [userId, provider, issuedAtRaw] = payload.split(":");
  if (!userId || (provider !== "google" && provider !== "microsoft")) return null;

  const issuedAt = Number(issuedAtRaw);
  if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > STATE_TTL_MS) return null;

  return { userId, provider };
}
