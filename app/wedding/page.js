"use client";

import { useEffect, useState } from "react";
import "./wedding.css";

const PAGES = [
  ["home", "Home"],
  ["story", "Our Story"],
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

const DAYS = [
  [
    "Friday 26 March 2027",
    [
      ["Bridal Party Rehearsal", "15:00 – 16:15", "20270326T150000", "20270326T161500", ""],
      ["Guests Arrival, Welcome Drinks & Games", "18:30 – 21:30", "20270326T183000", "20270326T213000", "Dress code: all white", "welcome"],
      ["Evening at OMA Lounge", "22:00 onwards", "20270326T220000", "20270327T010000", "", "oma"],
    ],
  ],
  [
    "Saturday 27 March 2027",
    [
      ["Wedding Ceremony", "12:00 (outdoor, weather permitting)", "20270327T120000", "20270327T133000", "Dress code: Mediterranean earth tones (champagne, sage, peach, sand, taupe, terracotta)"],
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

const ATTEND = [
  ["welcome", "Friday: Welcome Drinks & Games"],
  ["oma", "Friday night: Evening at OMA Lounge"],
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
    "&location=" + encodeURIComponent(LOC) +
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
  const [contact, setContact] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const v = contact.trim();
    if (v.length < 5) {
      setErr("Enter your email or phone number");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/verify-guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: v }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Not found");
      onPass({ name: data.name, email: data.email || (v.includes("@") ? v : "") });
    } catch (e) {
      setErr(e.message || "We couldn't find your RSVP.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ov" id="gate">
      <div className="ov-title">Ife &amp; Niyi</div>
      <p>For our attending guests — please enter the email or phone you used for your RSVP</p>
      <input
        type="text"
        placeholder="Email or phone number"
        autoComplete="off"
        aria-label="Email or phone"
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      <button onClick={submit} disabled={busy}>
        {busy ? "Checking..." : "Enter"}
      </button>
      <div id="ge" role="alert">{err}</div>
    </div>
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
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
          <symbol id="flower" viewBox="0 0 110 100">
            <path d="M55 100V60M40 100L30 62M70 100L82 58" stroke="#6f8a63" strokeWidth="2" fill="none" />
            <g fill="#9bb08f"><circle cx="38" cy="52" r="15" /><circle cx="62" cy="44" r="16" /><circle cx="80" cy="62" r="13" /><circle cx="52" cy="70" r="14" /></g>
            <g fill="#c9d6be"><circle cx="30" cy="68" r="9" /><circle cx="72" cy="30" r="9" /><circle cx="90" cy="46" r="8" /></g>
            <g fill="#fff"><circle cx="22" cy="46" r="5" /><circle cx="46" cy="28" r="5" /><circle cx="86" cy="76" r="5" /><circle cx="62" cy="86" r="5" /><circle cx="96" cy="30" r="4" /><circle cx="14" cy="60" r="4" /><circle cx="58" cy="18" r="4" /></g>
          </symbol>
        </svg>
        <svg className="fw a" viewBox="0 0 110 100" aria-hidden="true"><use href="#flower" /></svg>
        <svg className="fw b" viewBox="0 0 110 100" aria-hidden="true"><use href="#flower" /></svg>
      </button>
      <p className="env-hint">{open ? "" : "CLICK TO OPEN…"}</p>
    </div>
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
  const empty = { name: "", email: "", website: "", welcome: "", oma: "", brunch: "" };
  const [f, setF] = useState(empty);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(null); // { welcome, oma, brunch } once the guest has replied
  const [editing, setEditing] = useState(false);

  // Load any replies this guest already saved.
  useEffect(() => {
    if (!guest) {
      setSaved(null);
      setEditing(false);
      return;
    }
    let cancelled = false;
    fetch("/api/schedule-rsvp", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return;
        if (d && d.exists) {
          setSaved({ welcome: d.welcome, oma: d.oma, brunch: d.brunch });
          setF((prev) => ({
            ...prev,
            welcome: d.welcome ? "yes" : "no",
            oma: d.oma ? "yes" : "no",
            brunch: d.brunch ? "yes" : "no",
          }));
        } else {
          setSaved(null);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [guest]);

  useEffect(() => {
    if (!guest) {
      setF(empty);
      return;
    }
    setF((prev) => ({
      ...prev,
      name: guest.name || prev.name,
      email: guest.email || prev.email,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guest]);

  async function submit(e) {
    e.preventDefault();
    const er = {};
    if (!f.name.trim()) er.name = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) er.email = true;
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
        body: JSON.stringify({ full_name: f.name.trim(), email: f.email.trim(), website: f.website, welcome: f.welcome === "yes", oma: f.oma === "yes", brunch: f.brunch === "yes" }),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        let d = "";
        try { const j = await res.json(); d = j.detail || j.error || ""; } catch {}
        throw new Error(d || "bad");
      }
      setSaved({ welcome: f.welcome === "yes", oma: f.oma === "yes", brunch: f.brunch === "yes" });
      setEditing(false);
      setStatus({ type: "ok", text: "Thank you! Your replies have been noted." });
    } catch (err) {
      const extra =
        process.env.NODE_ENV !== "production" && err && err.message && err.message !== "bad"
          ? " (" + err.message + ")"
          : "";
      setStatus({ type: "bad", text: "Something went wrong. Please try again." + extra });
    } finally { clearTimeout(t); setBusy(false); }
  }

  if (saved && !editing) {
    return (
      <div className="form" id="attendance">
        <h3>Your replies</h3>
        <p className="c lead">
          Thank you{f.name ? ", " + f.name.split(" ")[0] : ""}! Here is what you told us. You can change your replies any time before 29 January 2027.
        </p>
        {status && <div className={"msg " + status.type} role="status">{status.text}</div>}
        <ul className="attire">
          {ATTEND.map(([k, label]) => (
            <li key={k}>
              <b>{label}:</b> {saved[k] ? "✓ Yes, I’ll be there" : "✕ No, I can’t make it"}
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="btn solid"
          style={{ marginLeft: 0 }}
          onClick={() => { setEditing(true); setStatus(null); }}
        >
          Change my replies
        </button>
      </div>
    );
  }

  return (
    <form className="form" id="attendance" onSubmit={submit} noValidate>
      <h3>Will you be joining us?</h3>
      <p className="c lead">Help us plan: please tell us which of these events you’ll attend.</p>
      <div className={"field" + (errors.name ? " invalid" : "")}><label htmlFor="att-name">Full name</label><input id="att-name" type="text" autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /><span className="err-msg">Please enter your full name.</span></div>
      <div className={"field" + (errors.email ? " invalid" : "")}><label htmlFor="att-email">Email address</label><input id="att-email" type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /><span className="err-msg">Please enter a valid email.</span></div>
      <div className="hp" aria-hidden="true"><label>Website<input type="text" tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} /></label></div>
      {ATTEND.map(([k, label]) => (
        <fieldset key={k} className={"field" + (errors[k] ? " invalid" : "")}><legend>{label}</legend>
          <div className="radio-row">{[["yes", "✓ Yes, I’ll be there"], ["no", "✕ No, I can’t make it"]].map(([v, text]) => (<label key={v}><input type="radio" name={"att-" + k} value={v} checked={f[k] === v} onChange={() => setF({ ...f, [k]: v })} /><span className="opt">{text}</span></label>))}</div>
          <span className="err-msg">Please choose an option.</span>
        </fieldset>
      ))}
      <button className="btn solid" type="submit" disabled={busy} style={{ marginLeft: 0 }}>{busy ? "Sending…" : saved ? "Update my replies" : "Send my replies"}</button>
      {saved && (
        <button className="btn" type="button" disabled={busy} onClick={() => { setEditing(false); setStatus(null); }}>Cancel</button>
      )}
      {status && <div className={"msg " + status.type} role="status">{status.text}</div>}
    </form>
  );
}

export default function WeddingPage() {
  const [stage, setStage] = useState("loading");
  const [page, setPage] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [guest, setGuest] = useState(null);

  // Ask the server whether the visitor already has a valid session cookie.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/session", { cache: "no-store" });
        if (!res.ok) throw new Error("no session");
        const data = await res.json();
        if (cancelled) return;
        setGuest({ name: data.name, email: data.email });
        setStage("done");
      } catch {
        if (!cancelled) setStage("gate");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function logout() {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {}
    setGuest(null);
    setMenuOpen(false);
    window.location.hash = "#home";
    setStage("gate");
  }

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

  const pass = (g) => {
    setGuest(g);
    setStage("env");
  };

  return (
    <>
      {stage === "gate" && <Gate onPass={pass} />}
      {stage === "env" && <Envelope onDone={() => setStage("done")} />}
      <header>
        <button id="mb" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>{menuOpen ? "✕" : "☰"}</button>
        <div className="brand"><b>Ife &amp; Niyi</b><small>27 March 2027</small></div>
      </header>
      <div id="sc" className={menuOpen ? "open" : ""} onClick={() => setMenuOpen(false)} />
      <nav id="nav" className={menuOpen ? "open" : ""} aria-label="Main menu">
        {PAGES.map(([id, label]) => (<a key={id} href={"#" + id} className={page === id ? "on" : ""}>{label}</a>))}
        {guest && (
          <a
            href="#home"
            className="logout"
            onClick={(e) => {
              e.preventDefault();
              logout();
            }}
          >
            Log out{guest.name ? " (" + guest.name.split(" ")[0] + ")" : ""}
          </a>
        )}
      </nav>
      <main>
        <section className={"pg" + (page === "home" ? " on" : "")}>
          <div className="hero">
            <h1 className="sr">Ife &amp; Niyi</h1>
            <div className="hero-grid">
              <div className="flyer"><img src="/ifeniyi.png" alt="Ife and Niyi, Saturday 27 March 2027, Tirana, Albania" /></div>
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
          <div className="wrap story"><PageHead title="Our Story 🤍" /><p className="scr">“At the right time, I, the Lord, will make it happen.”<br /><small style={{ font: "400 1rem var(--sans)", fontStyle: "normal" }}>Isaiah 60:22</small></p><p>Our journey is a beautiful testament to this promise: a love story ordained by God, brought together in His perfect timing and unfolding according to His divine plan.</p><p>A mutual interest in health and fitness quickly led to deeper conversations about faith, family, values and our dreams for the future. From the very beginning, there was a special alignment between us, one that God has continued to affirm throughout our journey.</p><div className="gal">{[1, 2, 3].map((n) => (<img key={n} src={`/gallery-${n}.jpg`} alt="Ife and Niyi" loading="lazy" />))}</div><p>Then came the proposal. Being the intentional man he is, Niyi had spent months carefully planning a proposal that brought to life everything Ife had ever described as her dream. On 10 June 2026, in beautiful Albania, we said yes to forever.</p><p>Now, we return to the very place where our journey to forever began, ready to say “I Do” before God and our loved ones.</p><p>In each other, we have found not only love, but a best friend and a partner with whom to build a life rooted in faith, family and purpose.</p><p>Oyeniyi, as I proudly call him, is God-fearing, humble, consistent, kind, loving, hardworking (my personal Mr Barry), selfless and intentional — all the qualities I had prayed for, and somehow, God answered with so much more. He is an extension of God’s love towards me.</p><p>Ifemi, as I fondly call her, is God-fearing, family-oriented, thoughtful, supportive and caring. She has a kind heart, values family deeply and is always there for the people she loves. I am grateful to God for the woman she is and for the opportunity to build a life with her.</p><p>We are deeply grateful to our families and loved ones, whose love, prayers and support have helped shape who we are today. As we begin this new chapter, we also hold close the memory of those we dearly wish could be here to celebrate with us. Though absent in person, they remain forever in our hearts.</p><p>Above all, we give all glory to God. His timing, His faithfulness and His hand in our journey have brought us here, and we couldn’t be more grateful.</p><p className="c">With love,<br /><br />Ife &amp; Niyi 🤍<br /><br /><span style={{ color: "var(--acc)" }}>#IfeNiyi2027</span></p><h3 style={{ marginTop: 40 }} className="c">A little bit about us</h3>{ABOUT.map(([q, a]) => (<details key={q}><summary>{q}</summary><p>{a}</p></details>))}</div>
        </section>
        <section className={"pg" + (page === "schedule" ? " on" : "")}>
          <div className="wrap">
            <PageHead title="Schedule" />
            <p className="c lead">Tap “Add to calendar” on any event to save it. All events are at Select Hill Resort, Tirana.</p>
            <a className="btn" href={MAPS} {...NEWTAB}>📍 Venue on Google Maps</a>
            {DAYS.map(([day, events]) => (
              <div key={day}>
                <h3 className="day">{day}</h3>
                {events.map((e) => (
                  <div className="ev" key={e[0]}>
                    <b>{e[0]}</b>
                    <small>{e[1]}</small>
                    {e[4] && <small>{e[4]}</small>}
                    <a className="btn" href={calendarUrl(e)} {...NEWTAB}>Add to calendar</a>
                    {e[5] && (
                      <button type="button" className="btn" onClick={() => document.getElementById("attendance")?.scrollIntoView({ behavior: "smooth" })}>
                        Let us know if you’re coming
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))}
            <AttendanceForm guest={guest} />
          </div>
        </section>
        <section className={"pg" + (page === "party" ? " on" : "")}><div className="wrap c"><PageHead title="Wedding Party" /><p className="lead">Stay tuned. We’ll introduce our wedding party here soon.</p></div></section>
        <section className={"pg" + (page === "travel" ? " on" : "")}><div className="wrap"><PageHead title="Travel" sub="Everything you need for your journey to Albania." /><h3>Getting into Albania</h3><p>We recommend flying into Tirana International Airport.</p><h3>Getting around</h3><ul><li><b>25-minute radius.</b> Our wedding is in the capital, Tirana. The venue is within 25 minutes of both the city centre and the airport.</li><li><b>Rides.</b> Rent a car (e.g. Rent Motors, beside the airport) or use a local taxi app: VrapOn Taxi Albania, Patoko or Speed Taxi Albania. Uber and Bolt are not available in Albania.</li><li><b>Local transport.</b> Albania has reliable buses, but most require cash in Albanian Lek. Exchange at the airport to avoid surge charges at ATMs.</li><li><b>Spending &amp; currency.</b> The national currency is the Albanian Lek, which can only be exchanged in Albania (airports). Euros are also widely used. Bring some cash for the city centre and local markets; international bank cards work for other expenses.</li></ul></div></section>
        <section className={"pg" + (page === "accommodation" ? " on" : "")}><div className="wrap"><PageHead title="Accommodation" sub="Everything you need for your stay in Albania." /><p className="eyebrow" style={{ marginBottom: 10 }}>Make yourself at home</p><h3>Select Hill Resort</h3><div className="box">Select Hill Resort is our recommended accommodation, as it is the wedding venue and where the welcome drinks will take place. Guests who decide to stay at the resort for the wedding weekend will be granted a discount of up to 20% as part of our wedding package.<br /><br />Please contact Ife &amp; Niyi directly for further information and details on booking the accommodation.<br /><a className="btn" style={{ marginLeft: 0 }} href="https://selecthill.com/" {...NEWTAB}>Visit Select Hill Resort</a></div><h3>Other stays in Tirana</h3><ul className="linklist"><li><a href="https://www.melia.com/en" {...NEWTAB}>Hotel Elisa Tirana</a></li><li><a href="https://all.accor.com" {...NEWTAB}>Mercure Hotel Tirana</a></li><li><a href="https://royalhill.tiranehotel.com/en/" {...NEWTAB}>Royal Hill Hotel</a></li><li><a href="https://xheko-imperial.com/" {...NEWTAB}>Xheko Imperial Hotel and Spa</a></li><li><a href="https://bianca.al/" {...NEWTAB}>Bianca Hotel and Villa</a></li></ul><h3>Stays in Durrës <small style={{ fontSize: "1rem", color: "var(--muted)" }}>(45 min to 1 hour away)</small></h3><ul className="linklist"><li><a href="https://grandhotelduka.com/" {...NEWTAB}>Grand Duka Hotel and Spa</a></li><li><a href="https://royalgdeluxe.al/" {...NEWTAB}>Royal G Deluxe Hotel</a></li><li><a href="https://www.ihg.com/crowneplaza/hotels/gb/en/durres/tiaab/hoteldetail" {...NEWTAB}>Crowne Plaza Durrës</a></li></ul></div></section>
        <section className={"pg" + (page === "registry" ? " on" : "")}><div className="wrap c"><PageHead title="Registry" /><p>Your presence is the greatest gift we could ask for, but if you would like to give a gift, we have created a gift registry to make it easier for you.</p><a className="btn" style={{ margin: "14px 0" }} href={REGISTRY_URL} {...NEWTAB}>Open our gift registry</a><p>Alternatively, a monetary gift can be sent to:</p><div className="box" style={{ display: "inline-block", textAlign: "left" }}>Name: MISS C I AJANI<br />Bank: Nationwide<br />Account number: 03352048<br />Sort code: 07-12-26</div><p style={{ fontFamily: "var(--serif)", fontSize: "1.5rem" }}>Thank you.</p></div></section>
        <section className={"pg" + (page === "qa" ? " on" : "")}><div className="wrap"><PageHead title="Q&A" /><p className="c lead">Got a question? Check here first.</p><details><summary>When is the final RSVP deadline?</summary><p>If you need to change your RSVP response, please do so by 29 January 2027 so we have an accurate headcount.</p></details><details><summary>Can I bring a date?</summary><p>Due to restrictions on numbers, entry is strictly by invitation only.</p></details><details><summary>Are kids welcome?</summary><p>As much as we adore your little ones, they will not be included in the ceremony or reception.</p></details><details><summary>Where should I park?</summary><p>There is plenty of free parking on site.</p></details><details><summary>Are the ceremony and reception venues wheelchair accessible?</summary><p>Yes.</p></details><details><summary>What should I wear?</summary><ul className="attire"><li><b>Friday:</b> All white for the welcome evening.</li><li><b>Saturday:</b> Mediterranean earth tones: champagne, sage, peach, sand, taupe and terracotta.</li></ul></details><details><summary>Is the wedding indoors or outdoors?</summary><p>Weather permitting, the ceremony will be outdoors and the reception indoors.</p></details><details><summary>Can I take pictures during the wedding?</summary><p>Yes! We’d love for you to take photos and share them with us.</p></details><details><summary>Is there a gift registry?</summary><p>Yes, see the <a href="#registry">Registry page</a>. Your presence is the greatest gift we could ask for.</p></details></div></section>
        <footer>#IfeNiyi2027</footer>
      </main>
    </>
  );
}