import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

// --- In-memory rate limiter -------------------------------------------------
// Caveat: this only works reliably on a single long-running Node process.
// If this app runs on a serverless platform (e.g. Vercel) where requests can
// land on different instances, this Map isn't shared across them, so the
// limit becomes "per warm instance" rather than a true global limit. It's
// still useful as a first line of defense and works perfectly on a
// traditional always-on Node server. For a serverless deployment that needs
// a hard guarantee, swap this for a shared store like Upstash Redis or
// Vercel KV — happy to wire that up if that's how this is hosted.
const WINDOW_MS = 60 * 60 * 1000; // 1 hour window
const MAX_PER_WINDOW = 5; // max submissions per IP per window
const MIN_INTERVAL_MS = 15 * 1000; // min gap between submissions per IP

const hits = new Map(); // ip -> array of submission timestamps (ms)

function getClientIp(request) {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

function checkRateLimit(ip) {
  const now = Date.now();
  const timestamps = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);

  if (
    timestamps.length > 0 &&
    now - timestamps[timestamps.length - 1] < MIN_INTERVAL_MS
  ) {
    return { allowed: false, reason: "too_fast" };
  }
  if (timestamps.length >= MAX_PER_WINDOW) {
    return { allowed: false, reason: "too_many" };
  }

  timestamps.push(now);
  hits.set(ip, timestamps);
  return { allowed: true };
}

// Periodic cleanup so `hits` doesn't grow forever on a long-running server.
let cleanupTimer = null;
function ensureCleanupTimer() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of hits.entries()) {
      const fresh = timestamps.filter((t) => now - t < WINDOW_MS);
      if (fresh.length === 0) hits.delete(ip);
      else hits.set(ip, fresh);
    }
  }, WINDOW_MS);
  cleanupTimer.unref?.();
}
ensureCleanupTimer();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  const ip = getClientIp(request);
  const { allowed, reason } = checkRateLimit(ip);

  if (!allowed) {
    const message =
      reason === "too_fast"
        ? "You're submitting too quickly — please wait a moment and try again."
        : "Too many RSVP attempts from this connection. Please try again later.";
    return NextResponse.json({ error: message }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { name, phone, email, attending, hp_check } = body || {};

  // Honeypot: a hidden field real visitors never see or fill in, but bots
  // that auto-fill every form field often do. Named something generic
  // (not "website"/"url"/"company") specifically so browser autofill
  // doesn't accidentally populate it and cause false positives. Report
  // fake success so bots don't learn the honeypot was tripped.
  if (hp_check) {
    return NextResponse.json({ ok: true });
  }

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
  }
  if (!phone || !phone.trim()) {
    return NextResponse.json({ error: "Please enter your phone number." }, { status: 400 });
  }
  if (!email || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  if (attending !== "yes" && attending !== "no") {
    return NextResponse.json({ error: "Invalid attendance value." }, { status: 400 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "RSVP storage isn't connected yet. Please add your Supabase credentials to .env.local — see README.md." },
      { status: 500 }
    );
  }

  const { error } = await supabaseAdmin.from("rsvps").insert({
    full_name: name.trim(),
    phone: phone.trim(),
    email: email.trim(),
    attending,
  });

  if (error) {
    return NextResponse.json(
      { error: "Something went wrong sending your RSVP — please try again in a moment." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}