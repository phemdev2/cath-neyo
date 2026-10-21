import crypto from "crypto";

export const COOKIE_NAME = "guest_session";
export const SESSION_MAX_AGE = 60 * 60 * 12; // 12 hours, in seconds

function getSecret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("SESSION_SECRET is missing or too short (use 32+ random characters).");
  }
  return s;
}

const b64 = (buf) => Buffer.from(buf).toString("base64url");
const sign = (payload) =>
  crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");

// Creates "payload.signature". The payload holds the guest name, email and expiry.
export function createToken(guest) {
  const payload = b64(
    JSON.stringify({
      n: guest.name || "",
      e: guest.email || "",
      exp: Date.now() + SESSION_MAX_AGE * 1000,
    })
  );
  return payload + "." + sign(payload);
}

// Returns { name, email } if the token is genuine and unexpired, otherwise null.
export function readToken(token) {
  try {
    if (!token) return null;
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return null;

    const expected = sign(payload);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data.exp || data.exp < Date.now()) return null;
    return { name: data.n, email: data.e };
  } catch {
    return null;
  }
}

// Reads the session cookie straight from the request headers
// (works on every Next.js version, unlike cookies() which changed in v15).
export function getGuest(request) {
  const header = request.headers.get("cookie") || "";
  const match = header
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(COOKIE_NAME + "="));
  if (!match) return null;
  return readToken(decodeURIComponent(match.slice(COOKIE_NAME.length + 1)));
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
};