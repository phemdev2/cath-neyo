import { getDb, getGuest, makeCookie, clearCookie, phoneKey, isYes } from "../_lib/guest";

export const dynamic = "force-dynamic";

const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 10;
}

export async function GET(req) {
  const g = await getGuest(req);
  if (!g) return Response.json({ error: "Not signed in" }, { status: 401 });
  return Response.json({ name: g.full_name });
}

export async function POST(req) {
  const missing = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "GUEST_SESSION_SECRET"]
    .filter((k) => !process.env[k]);
  if (missing.length) {
    console.error("[guest login] Missing env vars:", missing.join(", "));
    return Response.json({ error: "Server not configured. Missing: " + missing.join(", ") }, { status: 500 });
  }

  const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  if (limited(ip)) return Response.json({ error: "Too many attempts. Please wait a few minutes." }, { status: 429 });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Bad request" }, { status: 400 }); }
  const id = String(body.identifier || "").trim();
  if (!id || id.length > 200) return Response.json({ error: "Please enter your email or phone number." }, { status: 400 });

  let match = null;
  if (id.includes("@")) {
    const pattern = id.replace(/[\\%_]/g, "\\$&");
    const { data, error } = await getDb()
      .from("rsvps")
      .select("id, full_name, attending")
      .ilike("email", pattern);
    if (error) {
      console.error("[guest login] Supabase error:", error);
      return Response.json({ error: "Server setup problem. Please try again later." }, { status: 500 });
    }
    match = (data || []).find((r) => isYes(r.attending)) || null;
  } else {
    const key = phoneKey(id);
    if (key.length >= 7) {
      const { data, error } = await getDb().from("rsvps").select("id, full_name, phone, attending");
      if (error) {
        console.error("[guest login] Supabase error:", error);
        return Response.json({ error: "Server setup problem. Please try again later." }, { status: 500 });
      }
      match = (data || []).find((r) => isYes(r.attending) && phoneKey(r.phone) === key) || null;
    }
  }

  if (!match) {
    return Response.json(
      { error: "We couldn’t find an attending RSVP with those details. Please use the email or phone number from your RSVP." },
      { status: 401 }
    );
  }
  return new Response(JSON.stringify({ name: match.full_name }), {
    headers: { "Content-Type": "application/json", "Set-Cookie": makeCookie(match.id) },
  });
}

export async function DELETE() {
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json", "Set-Cookie": clearCookie() },
  });
}