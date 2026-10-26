"use client";

import { useCallback, useEffect, useState } from "react";
import "./wedding.css";

const PAGES = [
  ["home", "Home"],
  ["story", "Our Story"],
  ["moments", "Our Moments"],
  ["schedule", "Schedule"],
  ["party", "Wedding Party"],
  ["travel", "Travel"],
  ["accommodation", "Accommodation"],
  ["registry", "Registry"],
  ["qa", "Q&A"],
];
const PAGE_IDS = PAGES.map((p) => p[0]);

const MAPS =
  "https://www.google.com/maps/search/?api=1&query=Select+Hill+Resort+Dajt+Tirana+Albania";
const LOC = "Select Hill Resort, Rruga Nacionale Tirane-Dajt km5, Dajt, Tirana, Albania";
const TARGET = new Date("2027-03-27T12:00:00+01:00").getTime();

// TODO: paste your real MyRegistry link here
const REGISTRY_URL = "https://www.myregistry.com/REPLACE_WITH_YOUR_REGISTRY_URL";

// Each event: [title, time, startDate, endDate, details, attendKey?, location?]
// If no location (index 6) is given, the event defaults to the main venue (LOC).
const DAYS = [
  [
    "Friday 26 March 2027",
    [
      ["Bridal Party Rehearsal", "15:00 – 16:15", "20270326T150000", "20270326T161500", ""],
      ["Welcome Evening, Drinks & Games", "18:30 – 21:30", "20270326T183000", "20270326T213000", "Dress code: all white", "welcome"],
      [
        "OMA Dyrrachium Beach Lounge, Durres",
        "22:00 onwards",
        "20270326T220000",
        "20270327T010000",
        "For our guests who come alive in the night time, OMA is the place for you. Fridays are famously dedicated to the best Afrobeats, Amapiano, etc. If you're looking for more vibes, a packed dance floor, and a guaranteed good time, this is the place to be. This requires booking, if you're interested please contact Ife & Niyi directly so logistics can be sorted. PS: Just don't be late to the ceremony on Saturday! Dress code: Dress to impress",
        "oma",
        "OMA Dyrrachium Restaurant & Beach Lounge, Rruga e Currilave, Durrës 2001, Albania",
      ],
    ],
  ],
  [
    "Saturday 27 March 2027",
    [
      ["Wedding Ceremony", "12:00 (outdoor, weather permitting)", "20270327T120000", "20270327T133000", "Dress code: Mediterranean earth tones (champagne, sage, peach, sand, taupe, terracotta)"],
      ["Cocktail Hour & Photoshoot", "From 13:15-15:00", "20270327T131500", "20270327T150000", "Dress code: Mediterranean earth tones (champagne, sage, peach, sand, taupe, terracotta)"],
      ["Reception", "15:00 onwards (Wedding Hall)", "20270327T150000", "20270327T230000", "Dress code: Mediterranean earth tones"],
    ],
  ],
  [
    "Sunday 28 March 2027",
    [
      ["Post-Wedding Brunch", "Details to be announced", "20270328", "20270329", "Staying a bit longer? Join us for brunch. Details to be announced.", "brunch"],
    ],
  ],
];

// Events guests can say they're attending (the ceremony and reception are covered by the main RSVP)
const ATTEND = [
  ["welcome", "Friday: Welcome Drinks & Games"],
  ["oma", "Friday night: OMA Dyrrachium Beach Lounge, Durres"],
  ["brunch", "Sunday: Post-Wedding Brunch"],
];

const ABOUT = [
  ["Who’s going to make the bed?", "Whoever gets up last :)"],
  ["What was your most memorable date?", "There’s been many. But one we both agree on is Woburn Safari Park. We both love safaris, so experiencing it together made it all the more enjoyable. It’s contributed to our shortlist of honeymoon destinations."],
  ["What’s your favourite activity together?", "Going to the gym. Although we’re still trying to agree on how many hours we need to spend in the gym for each session."],
  ["What’s your favourite cuisine as a couple?", "We’re not big takeaway fans, but we love a good Indian restaurant."],
  ["What’s important to both of us?", "Building a legacy and making a positive impact on the next generation."],
];

const NEWTAB = { target: "_blank", rel: "noopener noreferrer" };

function calendarUrl(e) {
  return (
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    "&text=" + encodeURIComponent(e[0] + " · Ife & Niyi") +
    "&dates=" + e[2] + "/" + e[3] +
    "&ctz=Europe/Tirane" +
    "&location=" + encodeURIComponent(e[6] || LOC) +
    "&details=" + encodeURIComponent(e[4])
  );
}

const plural = (n, one, many) => (n === 1 ? one : many);

function Countdown() {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (now === null) return <div className="cd" />;
  const s = Math.floor(Math.max(0, TARGET - now) / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const items = [
    [d, plural(d, "day", "days")],
    [h, plural(h, "hour", "hours")],
    [m, plural(m, "minute", "minutes")],
    [sec, plural(sec, "second", "seconds")],
  ];
  return (
    <div className="cd">
      {items.map(([n, label]) => (
        <div key={label}>
          <b>{n}</b>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

function Gate({ onPass }) {
  const [id, setId] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!id.trim()) { setErr("Please enter your email or phone number."); return; }
    setErr("");
    setBusy(true);
    try {
      const res = await fetch("/api/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: id.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) onPass(data.name);
      else setErr(data.error || "Something went wrong. Please try again.");
    } catch {
      setErr("Couldn’t connect. Please check your internet and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="ov" id="gate" onSubmit={submit}>
      <div className="ov-title">Ife &amp; Niyi</div>
      <p style={{ maxWidth: 340, margin: "0 0 4px" }}>
        Welcome! Please enter the email address or phone number you used to RSVP.
      </p>
      <input
        type="text"
        inputMode="email"
        placeholder="Email or phone number"
        autoComplete="username"
        aria-label="Email or phone number"
        value={id}
        onChange={(e) => setId(e.target.value)}
      />
      <button type="submit" disabled={busy}>{busy ? "Checking…" : "Enter"}</button>
      <div id="ge" role="alert" style={{ maxWidth: 340 }}>{err}</div>
      <p style={{ fontSize: ".85rem", color: "var(--muted)", maxWidth: 340 }}>
        Haven’t RSVP’d yet? Please complete your RSVP first, then come back here.
      </p>
    </form>
  );
}

function Envelope({ onDone }) {
  const [open, setOpen] = useState(false);
  const [off, setOff] = useState(false);
  useEffect(() => {
    if (!open) return;
    const t1 = setTimeout(() => setOff(true), 1900);
    const t2 = setTimeout(onDone, 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [open, onDone]);
  return (
    <div className={"ov" + (off ? " off" : "")} id="env">
      <div className="ov-title">A Special Message Awaits…</div>
      <button className={"env" + (open ? " op" : "")} aria-label="Open the invitation" onClick={() => setOpen(true)}>
        <span className="bk" /><span className="lt">I &amp; N</span><span className="fr" /><span className="fl" /><span className="sl" />
      </button>
      <p className="env-hint">{open ? "" : "CLICK TO OPEN…"}</p>
    </div>
  );
}

// Photos for the Our Moments page. Files live in /public. Reorder or add rows freely: [file, description].
const MOMENTS = [
  ["moments-1.jpg", "Niyi proposing on one knee on the beach in Albania"],
  ["moments-2.jpg", "Ife and Niyi embracing under the floral arch after the proposal"],
  ["moments-3.jpg", "Ife holding a bouquet of roses with Niyi behind her under the glowing floral arch"],
  ["moments-4.jpg", "Ife and Niyi walking hand in hand towards the floral arch at sunset"],
  ["moments-5.jpg", "Ife and Niyi walking hand in hand at sunset"],
  ["moments-6.jpg", "Silhouette of Ife and Niyi facing the “Will you marry me?” neon sign at sunset"],
  ["moments-7.jpg", "Ife and Niyi posing together in front of the floral arch"],
  ["moments-8.jpg", "Ife and Niyi smiling in front of the floral arch at dusk"],
];

function Moments() {
  const [open, setOpen] = useState(null);
  const count = MOMENTS.length;

  useEffect(() => {
    if (open === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i + 1) % count);
      if (e.key === "ArrowLeft") setOpen((i) => (i - 1 + count) % count);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, count]);

  return (
    <>
      <style>{`
        .moments { columns: 2; column-gap: 12px; margin-top: 28px; }
        @media (min-width: 900px) { .moments { columns: 3; column-gap: 16px; } }
        .moments .moment {
          display: block; width: 100%; margin: 0 0 12px; padding: 0; border: 0;
          background: none; cursor: zoom-in; break-inside: avoid;
          border-radius: 14px; overflow: hidden;
          box-shadow: 0 10px 28px rgba(60, 45, 20, 0.14);
        }
        @media (min-width: 900px) { .moments .moment { margin-bottom: 16px; } }
        .moments .moment img {
          display: block; width: 100%; height: auto; transition: transform .5s ease;
        }
        .moments .moment:hover img, .moments .moment:focus-visible img { transform: scale(1.03); }
        .moments .moment:focus-visible { outline: 2px solid #a67c37; outline-offset: 2px; }
        .lb {
          position: fixed; inset: 0; z-index: 200; display: flex; align-items: center;
          justify-content: center; background: rgba(20, 15, 10, 0.93); cursor: zoom-out;
        }
        .lb img {
          max-width: 92vw; max-height: 88vh; object-fit: contain; border-radius: 10px;
          cursor: default; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }
        .lb button {
          position: absolute; display: grid; place-items: center; width: 46px; height: 46px;
          border: 0; border-radius: 50%; background: rgba(255, 255, 255, 0.14);
          color: #fff; font-size: 1.5rem; line-height: 1; cursor: pointer;
        }
        .lb button:hover { background: rgba(255, 255, 255, 0.28); }
        .lb .lb-x { top: 16px; right: 16px; }
        .lb .prev { left: 12px; top: 50%; transform: translateY(-50%); }
        .lb .next { right: 12px; top: 50%; transform: translateY(-50%); }
        .lb .lb-count {
          position: absolute; bottom: 18px; left: 50%; transform: translateX(-50%);
          padding: 6px 14px; border-radius: 999px; color: #fff;
          background: rgba(255, 255, 255, 0.14);
          font-size: .8rem; letter-spacing: .08em; pointer-events: none;
        }
      `}</style>
      <div className="moments">
        {MOMENTS.map(([file, alt], i) => (
          <button
            type="button"
            key={file}
            className="moment"
            onClick={() => setOpen(i)}
            aria-label={"Open photo " + (i + 1) + " of " + count + ": " + alt}
          >
            <img src={"/" + file} alt={alt} loading="lazy" />
          </button>
        ))}
      </div>
      {open !== null && (
        <div className="lb" role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={() => setOpen(null)}>
          <button type="button" className="lb-x" aria-label="Close" onClick={() => setOpen(null)}>✕</button>
          <button type="button" className="prev" aria-label="Previous photo" onClick={(e) => { e.stopPropagation(); setOpen((open - 1 + count) % count); }}>‹</button>
          <img src={"/" + MOMENTS[open][0]} alt={MOMENTS[open][1]} onClick={(e) => e.stopPropagation()} />
          <button type="button" className="next" aria-label="Next photo" onClick={(e) => { e.stopPropagation(); setOpen((open + 1) % count); }}>›</button>
          <span className="lb-count">{open + 1} / {count}</span>
        </div>
      )}
    </>
  );
}

function PageHead({ title, sub }) {
  return (
    <div className="page-head">
      <p className="eyebrow">The wedding of Ife &amp; Niyi</p>
      <h2>{title}</h2>
      <div className="flower-rule" aria-hidden="true">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1"><circle cx="12" cy="7.5" r="3" /><circle cx="7.5" cy="12" r="3" /><circle cx="16.5" cy="12" r="3" /><circle cx="12" cy="16.5" r="3" /><circle cx="12" cy="12" r="1.4" /><path d="M12 19.5V23" /></svg>
      </div>
      {sub && <p className="sub">{sub}</p>}
    </div>
  );
}

function AttendanceForm({ guest }) {
  const [f, setF] = useState({ welcome: "", oma: "", brunch: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null); // { type: "ok" | "bad", text }
  const [busy, setBusy] = useState(false);

  // Pre-fill with any earlier answers
  useEffect(() => {
    fetch("/api/schedule-rsvp")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d || !d.answered) return;
        const yn = (v) => (v === true ? "yes" : v === false ? "no" : "");
        setF({ welcome: yn(d.welcome), oma: yn(d.oma), brunch: yn(d.brunch) });
      })
      .catch(() => {});
  }, []);

  async function submit(e) {
    e.preventDefault();
    const er = {};
    ATTEND.forEach(([k]) => { if (!f[k]) er[k] = true; });
    setErrors(er);
    setStatus(null);
    if (Object.keys(er).length) return;

    setBusy(true);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    try {
      const res = await fetch("/api/schedule-rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          welcome: f.welcome === "yes",
          oma: f.oma === "yes",
          brunch: f.brunch === "yes",
        }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error("bad");
      setStatus({ type: "ok", text: "Thank you! Your replies have been saved. You can change them here at any time." });
    } catch {
      setStatus({ type: "bad", text: "Something went wrong saving your replies. Please try again in a moment." });
    } finally {
      clearTimeout(t);
      setBusy(false);
    }
  }

  return (
    <form className="form" id="attendance" onSubmit={submit} noValidate>
      <h3>Will you be joining us?</h3>
      <p className="c lead">
        {guest ? ` ${guest}. ` : ""}Help us plan: please tell us which of these events you’ll attend. The ceremony and reception are already covered by your RSVP.
      </p>

      {ATTEND.map(([k, label]) => (
        <fieldset key={k} className={"field" + (errors[k] ? " invalid" : "")}>
          <legend>{label}</legend>
          <div className="radio-row">
            {[["yes", "✓ Yes, I’ll be there"], ["no", "✕ No, I can’t make it"]].map(([v, text]) => (
              <label key={v}>
                <input type="radio" name={"att-" + k} value={v} checked={f[k] === v} onChange={() => setF({ ...f, [k]: v })} />
                <span className="opt">{text}</span>
              </label>
            ))}
          </div>
          <span className="err-msg">Please choose an option.</span>
        </fieldset>
      ))}

      <button className="btn solid" type="submit" disabled={busy} style={{ marginLeft: 0 }}>
        {busy ? "Saving…" : "Save my replies"}
      </button>
      {status && <div className={"msg " + status.type} role="status">{status.text}</div>}
    </form>
  );
}

export default function WeddingPage() {
  // "loading" avoids a flash of the login screen while we check for an existing session
  const [stage, setStage] = useState("loading"); // loading | gate | env | done
  const [guest, setGuest] = useState("");
  const [page, setPage] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/guest")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return setStage("gate");
        setGuest(d.name);
        let seen = false;
        try { seen = sessionStorage.getItem("envSeen") === "1"; } catch {}
        setStage(seen ? "done" : "env");
      })
      .catch(() => setStage("gate"));
  }, []);

  useEffect(() => {
    const route = () => {
      const h = (location.hash || "#home").slice(1);
      setPage(PAGE_IDS.includes(h) ? h : "home");
      setMenuOpen(false);
      window.scrollTo(0, 0);
    };
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    route();
    window.addEventListener("hashchange", route);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("hashchange", route);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const pass = (name) => {
    setGuest(name);
    setStage("env");
  };

  // Stable reference so the envelope's timers aren't reset by parent re-renders
  const envDone = useCallback(() => {
    try { sessionStorage.setItem("envSeen", "1"); } catch {}
    setStage("done");
  }, []);

  async function signOut() {
    try { await fetch("/api/guest", { method: "DELETE" }); } catch {}
    try { sessionStorage.removeItem("envSeen"); } catch {}
    setGuest("");
    setMenuOpen(false);
    window.location.hash = "#home";
    setStage("gate");
  }

  return (
    <>
      {stage === "gate" && <Gate onPass={pass} />}
      {stage === "env" && <Envelope onDone={envDone} />}

      {stage === "loading" && <div className="ov" />}
      <div hidden={stage !== "env" && stage !== "done"}>
        <header>
          <button id="mb" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>{menuOpen ? "✕" : "☰"}</button>
          <div className="brand"><b>Ife &amp; Niyi</b><small>27 March 2027</small></div>
        </header>
        <div id="sc" className={menuOpen ? "open" : ""} onClick={() => setMenuOpen(false)} />
        <nav id="nav" className={menuOpen ? "open" : ""} aria-label="Main menu">
          {PAGES.map(([id, label]) => (<a key={id} href={"#" + id} className={page === id ? "on" : ""}>{label}</a>))}
        </nav>
        <main>
          <section className={"pg" + (page === "home" ? " on" : "")}>
            <div className="hero">
              <h1 className="sr">Ife &amp; Niyi</h1>
              <div className="hero-grid">
                <div className="flyer"><img src="/ife.png" alt="Ife and Niyi, Saturday 27 March 2027, Tirana, Albania" /></div>
                <div className="txt">
                  <Countdown />
                  <div className="card">
                    <p className="lead" style={{ margin: 0 }}>We can’t wait to share our special day with you</p>
                    <p className="date">Saturday 27 March 2027</p>
                    <div className="venue"><p style={{ margin: 0 }}><span className="venue-name">Select Hill Resort</span><br />Rruga Nacionale Tirane-Dajt km5, Dajt<br />Tirana, Albania</p><a className="btn" href={MAPS} {...NEWTAB}>Open in Google Maps</a></div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section className={"pg" + (page === "story" ? " on" : "")}>
            <div className="wrap story"><PageHead title="Our Story 🤍" /><img src="/gallery-1.jpg" alt="Ife and Niyi" style={{ display: "block", width: "100%", maxWidth: 420, height: "auto", margin: "0 auto 32px", borderRadius: 14, boxShadow: "0 10px 28px rgba(60, 45, 20, 0.14)" }} /><p className="scr">“At the right time, I, the Lord, will make it happen.”<br /><small style={{ font: "400 1rem var(--sans)", fontStyle: "normal" }}>Isaiah 60:22</small></p><p>Our journey is a beautiful testament to this promise: a love story ordained by God, brought together in His perfect timing and unfolding according to His divine plan.</p><p>A mutual interest in health and fitness quickly led to deeper conversations about faith, family, values and our dreams for the future. From the very beginning, there was a special alignment between us, one that God has continued to affirm throughout our journey.</p><div className="gal">{[2, 3].map((n) => (<img key={n} src={`/gallery-${n}.jpg`} alt="Ife and Niyi" loading="lazy" />))}</div><p>Then came the proposal. Being the intentional man he is, Niyi had spent months carefully planning a proposal that brought to life everything Ife had ever described as her dream. On 10 June 2026, in beautiful Albania, we said yes to forever.</p><p>Now, we return to the very place where our journey to forever began, ready to say “I Do” before God and our loved ones.</p><p>In each other, we have found not only love, but a best friend and a partner with whom to build a life rooted in faith, family and purpose.</p><p>Oyeniyi, as I proudly call him, is God-fearing, humble, consistent, kind, loving, hardworking (my personal Mr Barry), selfless and intentional - all the qualities I had prayed for, and somehow, God answered with so much more. He is an extension of God’s love towards me.</p><p>Ifemi, as I fondly call her, is God-fearing, family-oriented, thoughtful, supportive and caring. She has a kind heart, values family deeply and is always there for the people she loves. I am grateful to God for the woman she is and for the opportunity to build a life with her.</p><p>We are deeply grateful to our families and loved ones, whose love, prayers and support have helped shape who we are today. As we begin this new chapter, we also hold close the memory of those we dearly wish could be here to celebrate with us. Though absent in person, they remain forever in our hearts.</p><p>Above all, we give all glory to God. His timing, His faithfulness and His hand in our journey have brought us here, and we couldn’t be more grateful.</p><p className="c">With love,<br /><br />Ife &amp; Niyi 🤍<br /><br /><span style={{ color: "var(--acc)" }}>#IfeNiyi2027</span></p><h3 style={{ marginTop: 40 }} className="c">A little bit about us</h3>{ABOUT.map(([q, a]) => (<details key={q}><summary>{q}</summary><p>{a}</p></details>))}</div>
          </section>
          <section className={"pg" + (page === "moments" ? " on" : "")}>
            <div className="wrap"><PageHead title="Our Moments" sub="Memories from the day we said yes to forever." /><Moments /></div>
          </section>
          <section className={"pg" + (page === "schedule" ? " on" : "")}>
            <div className="wrap">
              <PageHead title="Schedule" />
              <p className="c lead">Tap “Add to calendar” on any event to save it. Unless stated otherwise, events are at Select Hill Resort, Tirana.</p>
              <a className="btn" href={MAPS} {...NEWTAB}>📍 Venue on Google Maps</a>
              {DAYS.map(([day, events]) => (
                <div key={day}>
                  <h3 className="day">{day}</h3>
                  {events.map((e) => (
                    <div className="ev" key={e[0]}>
                      <b>{e[0]}</b>
                      <small>{e[1]}</small>
                      {e[4] && <small>{e[4]}</small>}
                      {e[6] && <small>Location: {e[6]}</small>}
                      <a className="btn" href={calendarUrl(e)} {...NEWTAB}>Add to calendar</a>
                      {e[5] && (
                        <button
                          type="button"
                          className="btn"
                          onClick={() =>
                            document.getElementById("attendance")?.scrollIntoView({ behavior: "smooth" })
                          }
                        >
                          Let us know if you’re coming
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ))}
              {guest && <AttendanceForm guest={guest} />}
            </div>
          </section>
          <section className={"pg" + (page === "party" ? " on" : "")}><div className="wrap c"><PageHead title="Wedding Party" /><p className="lead">Stay tuned. We’ll introduce our wedding party here soon.</p></div></section>
          <section className={"pg" + (page === "travel" ? " on" : "")}><div className="wrap"><PageHead title="Travel" sub="Everything you need for your journey to Albania." /><h3>Getting into Albania</h3><p>We recommend flying into Tirana International Airport.</p><div style={{ marginTop: 56, paddingTop: 32, borderTop: "1px solid rgba(176, 138, 74, 0.3)" }}><h3 style={{ marginTop: 0 }}>Getting around</h3><ul><li style={{ marginBottom: 28 }}><b>25-minute radius.</b> Our wedding is in the capital, Tirana. The venue is within 25 minutes of both the city centre and the airport.</li><li style={{ marginBottom: 28 }}><b>Rides.</b> Rent a car (e.g. Rent Motors, beside the airport) or use a local taxi app: VrapOn Taxi Albania, Patoko or Speed Taxi Albania. Uber and Bolt are not available in Albania.</li><li style={{ marginBottom: 28 }}><b>Local transport.</b> Albania has reliable buses, but most require cash in Albanian Lek. Exchange at the airport to avoid surge charges at ATMs.</li><li style={{ marginBottom: 0 }}><br></br><b>Spending &amp; currency.</b> The national currency is the Albanian Lek, which can only be exchanged in Albania (airports). Euros are also widely used. Bring some cash for the city centre and local markets; international bank cards work for other expenses.</li></ul></div></div></section>
          <section className={"pg" + (page === "accommodation" ? " on" : "")}><div className="wrap"><PageHead title="Accommodation" sub="Everything you need for your stay in Albania." /><p className="eyebrow" style={{ marginBottom: 10 }}>Make yourself at home</p><h3>Select Hill Resort</h3><div className="box">We’d recommend staying at Select Hill Resort for our wedding weekend. As part of our wedding package our guests will be granted a 20% discount for their room bookings.<br /><br />Please contact Ife &amp; Niyi directly to secure your rooms. Alternatively you can contact Select Hill Resort directly via WhatsApp on <a href="https://wa.me/355686611111" {...NEWTAB}>+355 68661 1111</a> and quote ‘IfeNiyi2027’ for the discount to be applied.<br /><br />Please secure your booking by <b>1 December 2026</b>.<br /><br /><a className="btn" style={{ marginLeft: 0 }} href="https://selecthill.com/" {...NEWTAB}>Visit Select Hill Resort</a></div><h3>Other stays in Tirana</h3><ul className="linklist"><li><a href="https://www.melia.com/en" {...NEWTAB}>Hotel Elisa Tirana</a></li><li><a href="https://all.accor.com" {...NEWTAB}>Mercure Hotel Tirana</a></li><li><a href="https://royalhill.tiranehotel.com/en/" {...NEWTAB}>Royal Hill Hotel</a></li><li><a href="https://xheko-imperial.com/" {...NEWTAB}>Xheko Imperial Hotel and Spa</a></li><li><a href="https://bianca.al/" {...NEWTAB}>Bianca Hotel and Villa</a></li></ul></div></section>
          <section className={"pg" + (page === "registry" ? " on" : "")}><div className="wrap c"><PageHead title="Registry" /><p>Your presence is the greatest gift we could ask for, but if you would like to give a gift, we have created a gift registry to make it easier for you.</p><a className="btn" style={{ margin: "14px 0" }} href={REGISTRY_URL} {...NEWTAB}>Open our gift registry</a><p>Alternatively, a monetary gift can be sent to:</p><div className="box" style={{ display: "inline-block", textAlign: "left" }}>Name: MISS C I AJANI<br />Bank: Nationwide<br />Account number: 03352048<br />Sort code: 07-12-26</div><p style={{ fontFamily: "var(--serif)", fontSize: "1.5rem" }}>Thank you.</p></div></section>
          <section className={"pg" + (page === "qa" ? " on" : "")}><div className="wrap"><PageHead title="Q&A" /><p className="c lead">Got a question? Check here first.</p><details><summary>When is the final RSVP deadline?</summary><p>If you need to change your RSVP response, please do so by 29 January 2027 so we have an accurate headcount.</p></details><details><summary>Can I bring a date?</summary><p>Due to restrictions on numbers, entry is strictly by invitation only.</p></details><details><summary>Are kids welcome?</summary><p>As much as we adore your little ones, they will not be included in the ceremony or reception.</p></details><details><summary>Where should I park?</summary><p>There is plenty of free parking on site.</p></details><details><summary>Are the ceremony and reception venues wheelchair accessible?</summary><p>Yes.</p></details><details><summary>What should I wear?</summary><ul className="attire"><li><b>Friday:</b> All white for the welcome evening.</li><li><b>Saturday:</b> Mediterranean earth tones: champagne, sage, peach, sand, taupe and terracotta.</li></ul></details><details><summary>Is the wedding indoors or outdoors?</summary><p>Weather permitting, the ceremony will be outdoors and the reception indoors.</p></details><details><summary>Can I take pictures during the wedding?</summary><p>Yes! We’d love for you to take photos and share them with us.</p></details><details><summary>Is there a gift registry?</summary><p>Yes, see the <a href="#registry">Registry page</a>. Your presence is the greatest gift we could ask for.</p></details></div></section>

          <footer>
            #IfeNiyi2027
            {guest && (
              <p style={{ font: "300 .85rem var(--sans)", margin: "10px 0 0" }}>
                Signed in as {guest} ·{" "}
                <button type="button" onClick={signOut} style={{ background: "none", border: 0, padding: 0, color: "var(--gold-deep)", textDecoration: "underline", cursor: "pointer", font: "inherit" }}>
                  Sign out
                </button>
              </p>
            )}
          </footer>
        </main>
      </div>
    </>
  );
}