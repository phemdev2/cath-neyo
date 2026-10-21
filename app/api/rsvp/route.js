import { getDb, getGuest } from "../_lib/guest";

export const dynamic = "force-dynamic";

// Load the signed-in guest's earlier answers (to pre-fill the form).
export async function GET(req) {
  const g = await getGuest(req);
  if (!g) return Response.json({ error: "Not signed in" }, { status: 401 });
  const { data } = await getDb()
    .from("event_attendance")
    .select("friday_welcome, oma_lounge, sunday_brunch")
    .eq("rsvp_id", g.id)
    .maybeSingle();
  return Response.json({
    answered: !!data,
    welcome: data?.friday_welcome ?? null,
    oma: data?.oma_lounge ?? null,
    brunch: data?.sunday_brunch ?? null,
  });
}

// Save answers for the signed-in guest. Identity comes from the session, never from the request body.
export async function POST(req) {
  const g = await getGuest(req);
  if (!g) return Response.json({ error: "Not signed in" }, { status: 401 });

  let b;
  try { b = await req.json(); } catch { return Response.json({ error: "Bad request" }, { status: 400 }); }
  for (const k of ["welcome", "oma", "brunch"]) {
    if (typeof b[k] !== "boolean") return Response.json({ error: "Missing answer." }, { status: 400 });
  }

  const { error } = await getDb().from("event_attendance").upsert(
    {
      rsvp_id: g.id,
      email: g.email,
      full_name: g.full_name,
      friday_welcome: b.welcome,
      oma_lounge: b.oma,
      sunday_brunch: b.brunch,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "rsvp_id" }
  );
  if (error) return Response.json({ error: "Could not save." }, { status: 500 });
  return Response.json({ ok: true });
}