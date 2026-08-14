import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

// Server-only. Returns null if RESEND_API_KEY isn't set yet, so callers
// can treat email as optional rather than crashing — an RSVP should still
// save successfully even if email isn't configured.
export function getResend() {
  if (!apiKey) return null;
  return new Resend(apiKey);
}