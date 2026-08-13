"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardClient({ rsvps, fetchError }) {
  const [search, setSearch] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rsvps;
    return rsvps.filter(
      (r) =>
        r.full_name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q)
    );
  }, [rsvps, search]);

  const stats = useMemo(() => {
    return rsvps.reduce(
      (acc, r) => {
        if (r.attending === "yes") acc.yes += 1;
        else acc.no += 1;
        return acc;
      },
      { yes: 0, no: 0 }
    );
  }, [rsvps]);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/dashboard-logout", { method: "POST" });
    router.push("/dashboard/login");
    router.refresh();
  }

  function exportCsv() {
    const header = ["Full name", "Phone", "Email", "Attending", "Submitted"];
    const rows = rsvps.map((r) => [
      r.full_name,
      r.phone,
      r.email,
      r.attending === "yes" ? "Yes" : "No",
      new Date(r.created_at).toLocaleString(),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "catherine-and-niyi-rsvps.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <>
      <header className="nav nav-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-20 gap-4">
            <div>
              <p className="serif text-lg sm:text-xl font-bold tracking-wide">RSVP Dashboard</p>
              <p className="text-xs sm:text-sm text-[var(--muted)]">Catherine &amp; Niyi &middot; private</p>
            </div>
            <button
              type="button"
              className="btn-ghost px-5 py-2.5 rounded-full text-sm font-semibold disabled:opacity-60"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? "Logging out…" : "Log out"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="soft-card rounded-[2rem] p-6 sm:p-10 reveal">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="section-title">Guest responses</p>
              <h1 className="serif text-3xl mt-2">Who&rsquo;s coming</h1>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                className="btn-ghost px-5 py-2.5 rounded-full text-sm font-semibold"
                onClick={() => router.refresh()}
              >
                Refresh
              </button>
              <button
                type="button"
                className="btn-ghost px-5 py-2.5 rounded-full text-sm font-semibold disabled:opacity-60"
                onClick={exportCsv}
                disabled={rsvps.length === 0}
              >
                Export CSV
              </button>
            </div>
          </div>

          {fetchError && (
            <p className="mt-4 text-sm text-[#a13f3a]">Couldn&rsquo;t load responses: {fetchError}</p>
          )}

          <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-7">
            <div className="stat">
              <b>{rsvps.length}</b>
              <span className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Total replies</span>
            </div>
            <div className="stat">
              <b style={{ color: "#4f7457" }}>{stats.yes}</b>
              <span className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Attending</span>
            </div>
            <div className="stat">
              <b style={{ color: "#8a4f47" }}>{stats.no}</b>
              <span className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Not attending</span>
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="dashSearch" className="sr-only">Search responses</label>
            <input
              id="dashSearch"
              type="search"
              placeholder="Search by name, email, or phone…"
              className="w-full sm:w-80 border border-[var(--line)] bg-white/90 rounded-full px-5 py-3 outline-none focus:border-[var(--gold)]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="mt-6 table-scroll">
            <table className="guests">
              <caption>{filtered.length} of {rsvps.length} responses shown</caption>
              <thead>
                <tr>
                  <th>Full name</th><th>Phone</th><th>Email</th><th>Attending</th><th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td data-label="Full name">{r.full_name}</td>
                    <td data-label="Phone">{r.phone}</td>
                    <td data-label="Email">{r.email}</td>
                    <td data-label="Attending">
                      <span className={`tag ${r.attending}`}>{r.attending === "yes" ? "Yes" : "No"}</span>
                    </td>
                    <td data-label="Submitted">{new Date(r.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-center text-sm text-[var(--muted)] py-8">
                {rsvps.length === 0 ? "No RSVPs yet." : "No responses match your search."}
              </p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
