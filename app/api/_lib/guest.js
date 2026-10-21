import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// Server-only helpers for guest login. Needs these env vars:
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GUEST_SESSION_SECRET (long random string)
// Created lazily so the build doesn't fail when env vars are only available at runtime.
let _db;
export function getDb() {
  if (!_db) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    _db = createClient(url, key);
  }
  return _db;
}

const COOKIE = "guest_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const b64 = (s) => Buffer.from(s).toString("base64url");
const sign = (data) =>
  crypto.createHmac("sha256", process.env.GUEST_SESSION_SECRET).update(data).digest("base64url");

export function makeCookie(rsvpId) {
  const payload = b64(JSON.stringify({ id: rsvpId, exp: Date.now() + MAX_AGE * 1000 }));
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE}=${payload}.${sign(payload)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}${secure}`;
}

export function clearCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

// Returns the guest's RSVP row if the cookie is valid AND they are still marked as attending.
export async function getGuest(req) {
  const raw = (req.headers.get("cookie") || "")
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(COOKIE + "="));
  if (!raw) return null;
  const [payload, sig] = raw.slice(COOKIE.length + 1).split(".");
  if (!payload || !sig) return null;

  const good = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (good.length !== given.length || !crypto.timingSafeEqual(good, given)) return null;

  let data;
  try { data = JSON.parse(Buffer.from(payload, "base64url").toString()); } catch { return null; }
  if (!data.id || !data.exp || data.exp < Date.now()) return null;

  const { data: row } = await getDb()
    .from("rsvps")
    .select("id, full_name, email, phone, attending")
    .eq("id", data.id)
    .maybeSingle();
  return row && isYes(row.attending) ? row : null;
}

// Compare phone numbers by their last 10 digits so "+44 7700 900442" matches "07700900442".
export const phoneKey = (p) => String(p || "").replace(/\D/g, "").slice(-10);

// Tolerates "yes", "Yes", "YES", true, etc.
export const isYes = (v) => v === true || String(v || "").trim().toLowerCase() === "yes";