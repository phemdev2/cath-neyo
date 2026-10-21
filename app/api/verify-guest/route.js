import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabase as anonClient } from "../../../lib/supabaseClient";
import {
  COOKIE_NAME,
  SESSION_MAX_AGE,
  cookieOptions,
  createToken,
} from "../../../lib/session";

export const dynamic = "force-dynamic";

const NOT_FOUND =
  "We couldn't find an RSVP with those details. Please use the email or phone number you RSVP'd with.";

// Prefer a server-only service-role client (bypasses row-level security).
// Falls back to your existing client if the key isn't set.
function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    return createClient(url, key, { auth: { persistSession: false } });
  }
  return anonClient || null;
}

const digitsOnly = (s) => String(s || "").replace(/\D/g, "");
// Match phones on their last 9 digits (handles +44, leading 0, spaces, dashes)
const phoneKey = (s) => digitsOnly(s).slice(-9);

const isAttending = (v) =>
  v === true || ["yes", "true", "y", "1"].includes(String(v).trim().toLowerCase());

// Visit /api/verify-guest in the browser: "ok" means the route is registered.
export async function GET() {
  return NextResponse.json({ ok: true, route: "verify-guest" });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const contact = String(body.contact || "").trim();
  if (contact.length < 5) {
    return NextResponse.json({ error: "Enter your email or phone number." }, { status: 400 });
  }

  const isEmail = contact.includes("@");
  if (!isEmail && digitsOnly(contact).length < 7) {
    return NextResponse.json({ error: "Enter a valid email or phone number." }, { status: 400 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { error: "Guest list isn't connected yet. Add Supabase credentials to .env.local." },
      { status: 500 }
    );
  }

  const { data, error } = await db
    .from("rsvps")
    .select("full_name, email, phone, attending");

  if (error) {
    console.error("verify-guest lookup failed:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  const wanted = isEmail ? contact.toLowerCase() : phoneKey(contact);

  const guest = (data || []).find((g) => {
    if (!isAttending(g.attending)) return false;
    return isEmail
      ? String(g.email || "").trim().toLowerCase() === wanted
      : phoneKey(g.phone) === wanted;
  });

  if (!guest) {
    // Server-side log only: shows why nothing matched while you test.
    console.log(
      `verify-guest: no match for "${contact}" among ${data?.length ?? 0} rows`
    );
    return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
  }

  let token;
  try {
    token = createToken({ name: guest.full_name, email: guest.email });
  } catch (e) {
    console.error("verify-guest session error:", e.message);
    return NextResponse.json(
      { error: "Login isn't configured yet. Add SESSION_SECRET to .env.local." },
      { status: 500 }
    );
  }

  const res = NextResponse.json({ name: guest.full_name, email: guest.email });
  res.cookies.set(COOKIE_NAME, token, { ...cookieOptions, maxAge: SESSION_MAX_AGE });
  return res;
}