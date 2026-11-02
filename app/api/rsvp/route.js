import { getDb } from "../_lib/guest";

export const dynamic = "force-dynamic";

// Public endpoint: anyone can submit the RSVP form. No session required.
export async function POST(req) {
  let b;
  try { b = await req.json(); } catch { return Response.json({ error: "Bad request" }, { status: 400 }); }

  const full_name = String(b.full_name ?? "").trim();
  const phone = String(b.phone ?? "").trim();
  const email = String(b.email ?? "").trim().toLowerCase();
  const attending = b.attending === "no" ? "no" : "yes";

  if (!full_name || !phone || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Please check your details." }, { status: 400 });
  }

  const db = getDb();

  const { data: emailHit } = await db.from("rsvps").select("id").eq("email", email).maybeSingle();
  if (emailHit) return Response.json({ code: "duplicate", field: "email" }, { status: 409 });

  const { data: phoneHit } = await db.from("rsvps").select("id").eq("phone", phone).maybeSingle();
  if (phoneHit) return Response.json({ code: "duplicate", field: "phone" }, { status: 409 });

  const { error } = await db.from("rsvps").insert({ full_name, phone, email, attending });
  if (error) {
    console.error("RSVP insert failed:", error);
    return Response.json({ error: "Could not save your RSVP." }, { status: 500 });
  }

  return Response.json({ ok: true }, { status: 201 });
}