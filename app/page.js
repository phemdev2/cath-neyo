"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

const WEDDING_DATE = new Date("2027-03-27T00:00:00");

const NAV_ITEMS = [
  { id: "home", label: "Home" },
  { id: "rsvp", label: "RSVP" },
];

function getCountdown() {
  const diff = WEDDING_DATE - new Date();
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 };
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

export default function Home() {
  const [section, setSection] = useState("home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [countdown, setCountdown] = useState({ d: "–", h: "–", m: "–", s: "–" });

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    attending: "yes",
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    setCountdown(getCountdown());
    const id = setInterval(() => setCountdown(getCountdown()), 1000);
    return () => clearInterval(id);
  }, []);

  function goTo(id) {
    setSection(id);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = true;
    if (!form.phone.trim()) nextErrors.phone = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nextErrors.email = true;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!supabase) {
      setSubmitError(
        "RSVP storage isn't connected yet. Please add your Supabase credentials to .env.local — see README.md."
      );
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const { error } = await supabase.from("rsvps").insert({
      full_name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      attending: form.attending,
    });

    setSubmitting(false);

    if (error) {
      setSubmitError("Something went wrong sending your RSVP — please try again in a moment.");
      return;
    }

    setSubmitted(true);
  }

  function resetForm() {
    setForm({ name: "", phone: "", email: "", attending: "yes" });
    setErrors({});
    setSubmitted(false);
    setSubmitError(null);
  }

  function addToCalendar() {
    const url =
      "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      "&text=" + encodeURIComponent("Ife & Niyi's Wedding") +
      "&dates=20270327/20270328" +
      "&details=" + encodeURIComponent("We're getting married! Join us to celebrate — full details to follow.");
    window.open(url, "_blank", "noopener");
  }

  return (
    <>
      <header className="nav nav-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="min-w-0">
                <p className="serif text-base sm:text-xl font-bold tracking-wide truncate">Ife &amp; Niyi</p>
                <p className="text-xs sm:text-sm text-[var(--muted)]">27 March 2027</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => goTo(item.id)}
                  className={`nav-link px-4 py-2 rounded-full text-sm font-medium hover:bg-white/70 transition ${section === item.id ? "active" : ""}`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <button
              className="md:hidden btn-ghost px-3.5 py-2 rounded-full text-sm font-semibold shrink-0"
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-controls="mobileMenu"
            >
              Menu
            </button>
          </div>
          {mobileOpen && (
            <div id="mobileMenu" className="md:hidden pb-4">
              <div className="soft-card rounded-2xl p-3 flex flex-col gap-1">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => goTo(item.id)}
                    className={`nav-link text-left px-4 py-3 rounded-xl hover:bg-white transition ${section === item.id ? "active" : ""}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-14">
        {section === "home" && (
          <section className="py-4 sm:py-10">
            {/*
              hero-grid (see globals.css):
              - mobile / tablet: single column, everything stacks
                (image, then countdown, then message card, then CTAs)
              - desktop (lg+): two columns side by side, image fixed-width
                on the left, details flowing on the right, vertically centered
            */}
            <div className="hero-grid max-w-5xl mx-auto">
              <div className="flyer-frame fade-up" style={{ animationDelay: ".05s" }}>
                <img
                  src="/ifeniyi.png"
                  alt="Save the date: Ife &amp; Niyi, Saturday 27 March 2027, Tirana, Albania. Invitation to follow."
                />
              </div>

              <div className="text-center lg:text-left">
                <div
                  className="countdown-grid fade-up max-w-sm mx-auto lg:max-w-md lg:mx-0"
                  style={{ animationDelay: ".15s" }}
                  aria-live="polite"
                >
                  <div className="countdown-box"><b>{countdown.d}</b><span>Days</span></div>
                  <div className="countdown-box"><b>{countdown.h}</b><span>Hours</span></div>
                  <div className="countdown-box"><b>{countdown.m}</b><span>Minutes</span></div>
                  <div className="countdown-box"><b>{countdown.s}</b><span>Seconds</span></div>
                </div>

                <div className="mt-9 sm:mt-10 lg:mt-8 soft-card rounded-[2rem] p-6 sm:p-10 max-w-2xl mx-auto lg:mx-0 reveal">
                  <p className="text-[var(--ink-soft)] leading-7 text-center lg:center">
                    To our beloved family and friends, we can’t wait to share our special day with you all.
                  </p>
                  <p className="serif text-1xl sm:text-3xl mt-3 text-center lg:text-center">-Invitation to follow-</p>
                </div>

                <div
                  className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 mt-7 sm:mt-8 fade-up max-w-sm sm:max-w-none mx-auto lg:mx-0"
                  style={{ animationDelay: ".22s" }}
                >
                  <button onClick={() => goTo("rsvp")} className="btn-primary w-full sm:w-auto px-6 py-3.5 sm:py-3 rounded-full text-sm font-semibold">
                   Register your RSVP by 30th September 2026.
                  </button>
                  <button
                    type="button"
                    onClick={addToCalendar}
                    className="btn-ghost w-full sm:w-auto px-6 py-3.5 sm:py-3 rounded-full text-sm font-semibold inline-flex items-center justify-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" aria-hidden="true">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                    Add to calendar
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {section === "rsvp" && (
          <section>
            <div className="soft-card rounded-[2rem] p-5 sm:p-10 max-w-xl mx-auto reveal">
              <p className="section-title">RSVP</p>
              <h2 className="serif text-2xl sm:text-3xl mt-2">Let us know you&rsquo;re coming</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">RSVP 30th September 2026. All the final details will follow closer to the day.</p>

              <form className="form mt-6 sm:mt-7" onSubmit={handleSubmit} noValidate>
                <div className={`field mb-5 ${errors.name ? "invalid" : ""}`}>
                  <label htmlFor="name">Full name<span className="required">*</span></label>
                  <input
                    id="name"
                    type="text"
                    inputMode="text"
                    placeholder="Rachel &amp; David"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                  <span className="err-msg">Please enter your full name.</span>
                </div>

                <div className={`field mb-5 ${errors.phone ? "invalid" : ""}`}>
                  <label htmlFor="phone">Phone number<span className="required">*</span></label>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    placeholder="+44 7700 900 442"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    required
                  />
                  <span className="err-msg">Please enter your phone number.</span>
                </div>

                <div className={`field mb-5 ${errors.email ? "invalid" : ""}`}>
                  <label htmlFor="email">Email address<span className="required">*</span></label>
                  <input
                    id="email"
                    type="email"
                    inputMode="email"
                    placeholder="chidinma.eze@example.com"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    required
                  />
                  <span className="err-msg">Please enter a valid email.</span>
                </div>

                <div className="field mt-5">
                  <label>Will you be attending?</label>
                  <div className="radio-row" role="radiogroup" aria-label="Will you be attending?">
                    {[
                      { value: "yes", label: "✓ Yes, I'll be there" },
                      { value: "no", label: "✕ No, I can't make it" },
                    ].map((opt) => (
                      <label key={opt.value} className="flex-1 sm:flex-none min-w-[min(100%,220px)] sm:min-w-0">
                        <input
                          type="radio"
                          name="attending"
                          value={opt.value}
                          checked={form.attending === opt.value}
                          onChange={() => setForm((f) => ({ ...f, attending: opt.value }))}
                        />
                        <span className="opt justify-center sm:justify-start">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button className="btn-primary w-full sm:w-auto px-6 py-3.5 sm:py-3 rounded-full font-semibold disabled:opacity-60" type="submit" disabled={submitting}>
                    {submitting ? "Submitting…" : "Submit RSVP"}
                  </button>
                  <button className="btn-ghost w-full sm:w-auto px-6 py-3.5 sm:py-3 rounded-full font-semibold" type="button" onClick={resetForm}>Clear</button>
                </div>

                {submitError && (
                  <p className="mt-4 text-sm text-[#a13f3a]" role="alert">{submitError}</p>
                )}
              </form>

              <div className={`confirmation items-start gap-3 ${submitted ? "show" : ""}`} role="status">
                <svg width="26" height="26" viewBox="0 0 26 26" className="flex-shrink-0 mt-0.5" aria-hidden="true">
                  <circle cx="13" cy="13" r="12" fill="none" stroke="#4f7457" strokeWidth="1.4" />
                  <path d="M7 13.5l4 4 8-9" fill="none" stroke="#4f7457" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div>
                  <h3 className="serif text-2xl">Thank you for registering!</h3>
                  <p className="mt-1 text-[var(--ink-soft)]">Your reply has been noted. Full wedding details will be shared closer to the day.</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="footer max-w-6xl mx-auto px-4 sm:px-6 pb-8 sm:pb-10 pt-8">
        <div className="rule mb-6"><span></span><span className="text-[var(--gold)]">&#10047;</span><span></span></div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-[var(--muted)] text-center sm:text-left">
          <span>#IfeNiyi2027</span>
          <button className="text-[var(--gold)] hover:text-[var(--ink)] transition" type="button" onClick={() => goTo("home")}>
            Back to top
          </button>
        </div>
        <div className="text-center mt-4">
          <Link href="/dashboard/login" className="text-xs text-[var(--muted)] opacity-60 hover:opacity-100 transition">
            Admin
          </Link>
        </div>
      </footer>
    </>
  );
}