import { NextResponse } from "next/server";
import { getGuest } from "../../../lib/session";

export const dynamic = "force-dynamic";

export async function GET(request) {
  let guest = null;
  try {
    guest = getGuest(request);
  } catch (e) {
    console.error("session check failed:", e.message);
  }
  if (!guest) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  return NextResponse.json({ name: guest.name, email: guest.email });
}