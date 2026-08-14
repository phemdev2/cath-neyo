import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabaseClient";
import { getResend } from "../../../lib/resend";

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Postgres unique-violation error code.
const UNIQUE_VIOLATION = "23505";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const full_name = (body.full_name || "").trim();
  const phone = (body.phone || "").trim();
  const email = (body.email || "").trim();
  const attending = body.attending === "no" ? "no" : "yes";

  if (!full_name || !phone || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Please provide a valid name, phone number, and email." },
      { status: 400 }
    );
  }

  if (!supabase) {
    return NextResponse.json(
      { error: "RSVP storage isn't connected yet. Add Supabase credentials to .env.local." },
      { status: 500 }
    );
  }

  const { error: dbError } = await supabase.from("rsvps").insert({
    full_name,
    phone,
    email,
    attending,
  });

  if (dbError) {
    // Catching the unique constraint violation here allows us to send
    // a specific 409 status code that your frontend knows how to handle.
    if (dbError.code === UNIQUE_VIOLATION) {
      const message = dbError.message || "";
      const field = message.includes("phone") ? "phone" : "email";
      return NextResponse.json(
        { code: "duplicate", field },
        { status: 409 }
      );
    }

    console.error("RSVP insert failed:", dbError);
    return NextResponse.json(
      { error: "Something went wrong saving your RSVP — please try again." },
      { status: 500 }
    );
  }

  // From here on, the RSVP is safely saved. Email is a nice-to-have, so
  // failures here are logged but never turn a successful RSVP into an
  // error response for the guest.
  const resend = getResend();
  if (resend) {
    const notifyEmail = process.env.NOTIFY_EMAIL;
    const fromEmail = process.env.RESEND_FROM_EMAIL || "RSVP <onboarding@resend.dev>";
    const attendingLabel = attending === "yes" ? "Yes, attending" : "Not attending";

    const tasks = [];

    if (notifyEmail) {
      tasks.push(
        resend.emails.send({
          from: fromEmail,
          to: notifyEmail,
          subject: `New RSVP: ${full_name} (${attendingLabel})`,
          html: `
            <p>A new RSVP just came in:</p>
            <ul>
              <li><strong>Name:</strong> ${escapeHtml(full_name)}</li>
              <li><strong>Phone:</strong> ${escapeHtml(phone)}</li>
              <li><strong>Email:</strong> ${escapeHtml(email)}</li>
              <li><strong>Attending:</strong> ${attendingLabel}</li>
            </ul>
          `,
        })
      );
    }

    tasks.push(
      resend.emails.send({
        from: fromEmail,
        to: email,
        subject: "We've received your RSVP — Ife & Niyi, 27 March 2027",
        html: `
          <p>Hi ${escapeHtml(full_name)},</p>
          <p>Thank you for registering your RSVP for Ife &amp; Niyi's wedding on <strong>27 March 2027</strong>.</p>
          <p>We've noted that you're <strong>${attendingLabel.toLowerCase()}</strong>. Full details — venue, accommodation, and the rest of the celebration — will follow closer to the day.</p>
          <p>With love,<br />Ife &amp; Niyi</p>
        `,
      })
    );

    const results = await Promise.allSettled(tasks);
    results.forEach((r) => {
      if (r.status === "rejected") {
        console.error("RSVP email failed to send:", r.reason);
      }
    });
  }

  return NextResponse.json({ ok: true });
}