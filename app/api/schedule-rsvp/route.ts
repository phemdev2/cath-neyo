import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabase as anonClient } from "../../../lib/supabaseClient";
import { getGuest } from "../../../lib/session";

export const dynamic = "force-dynamic";

// Prefer a server-only service-role client (bypasses row-level security).
function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    return createClient(url, key, { auth: { persistSession: false } });
  }
  return anonClient || null;
}

// Returns the signed-in guest's saved event replies, if any.
export async function GET(request) {
  let guest = null;
  try {
    guest = getGuest(request);
  } catch (e) {
    console.error("schedule-rsvp session error:", e.message);
  }
  if (!guest || !guest.email) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Storage not connected." }, { status: 500 });
  }

  const { data, error } = await db
    .from("schedule_rsvps")
    .select("welcome, oma, brunch")
    .eq("email", String(guest.email).trim().toLowerCase())
    .maybeSingle();

  if (error) {
    console.error("schedule-rsvp load failed:", error);
    return NextResponse.json({ error: "Couldn't load your replies." }, { status: 500 });
  }

  if (!data) return NextResponse.json({ exists: false });
  return NextResponse.json({
    exists: true,
    welcome: !!data.welcome,
    oma: !!data.oma,
    brunch: !!data.brunch,
  });
}

export async function POST(request) {
  // 1. The guest must be signed in (valid signed session cookie).
  let guest = null;
  try {
    guest = getGuest(request);
  } catch (e) {
    console.error("schedule-rsvp session error:", e.message);
  }
  if (!guest || !guest.email) {
    return NextResponse.json(
      { error: "Please sign in with your RSVP email or phone first." },
      { status: 401 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // 2. Spam trap: real guests never fill the hidden "website" field.
  if (body.website) {
    return NextResponse.json({ ok: true });
  }

  const full_name = String(body.full_name || "").trim();
  if (!full_name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Storage not connected." }, { status: 500 });
  }

  // 3. One row per guest, keyed by their verified RSVP email.
  const { error } = await db.from("schedule_rsvps").upsert(
    {
      email: String(guest.email).trim().toLowerCase(),
      full_name,
      welcome: !!body.welcome,
      oma: !!body.oma,
      brunch: !!body.brunch,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "email" }
  );

  if (error) {
    console.error("schedule-rsvp insert failed:", error);
    return NextResponse.json(
      {
        error: "Failed to save your replies.",
        detail: process.env.NODE_ENV !== "production" ? error.message : undefined,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}