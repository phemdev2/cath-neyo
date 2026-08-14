"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function AdminDashboard() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [userEmail, setUserEmail] = useState(null);

  const [rsvps, setRsvps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: "", phone: "", email: "", attending: "yes" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState(null);

  const [deletingId, setDeletingId] = useState(null);
  const [rowError, setRowError] = useState({});

  const [search, setSearch] = useState("");
  const [attendingFilter, setAttendingFilter] = useState("all"); // all | yes | no
  const [sortKey, setSortKey] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc"); // asc | desc

  // Auth guard: redirect to login if there's no active session.
  useEffect(() => {
    if (!supabase) {
      setCheckingSession(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/admin/login");
      } else {
        setUserEmail(data.session.user.email);
        setCheckingSession(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/admin/login");
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [router]);

  // Fetch RSVPs once we know we're signed in.
  useEffect(() => {
    if (checkingSession || !supabase) return;

    async function fetchRsvps() {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("rsvps")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError("Couldn't load RSVPs — please refresh and try again.");
      } else {
        setRsvps(data || []);
      }
      setLoading(false);
    }

    fetchRsvps();
  }, [checkingSession]);

  async function handleSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  function startEdit(r) {
    setEditingId(r.id);
    setEditForm({
      full_name: r.full_name || "",
      phone: r.phone || "",
      email: r.email || "",
      attending: r.attending || "yes",
    });
    setEditError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError(null);
  }

  async function saveEdit(id) {
    if (!editForm.full_name.trim() || !editForm.phone.trim() || !editForm.email.trim()) {
      setEditError("All fields are required.");
      return;
    }

    setSavingEdit(true);
    setEditError(null);

    const { data, error: updateError } = await supabase
      .from("rsvps")
      .update({
        full_name: editForm.full_name.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim().toLowerCase(),
        attending: editForm.attending,
      })
      .eq("id", id)
      .select()
      .single();

    setSavingEdit(false);

    if (updateError) {
      if (updateError.code === "23505") {
        setEditError("Another RSVP already uses that email or phone number.");
      } else {
        setEditError("Couldn't save changes — please try again.");
      }
      return;
    }

    setRsvps((prev) => prev.map((r) => (r.id === id ? data : r)));
    setEditingId(null);
  }

  async function handleDelete(id) {
    const confirmed = window.confirm("Delete this RSVP? This can't be undone.");
    if (!confirmed) return;

    setDeletingId(id);
    setRowError((prev) => ({ ...prev, [id]: null }));

    const { error: deleteError } = await supabase.from("rsvps").delete().eq("id", id);

    setDeletingId(null);

    if (deleteError) {
      setRowError((prev) => ({ ...prev, [id]: "Couldn't delete — please try again." }));
      return;
    }

    setRsvps((prev) => prev.filter((r) => r.id !== id));
  }

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function sortIndicator(key) {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " ▲" : " ▼";
  }

  function csvEscape(value) {
    const str = String(value ?? "");
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  function handleExportCsv() {
    const headers = ["Name", "Phone", "Email", "Attending", "Submitted"];
    const rows = visibleRsvps.map((r) => [
      r.full_name,
      r.phone,
      r.email,
      r.attending === "yes" ? "Yes" : "No",
      r.created_at ? new Date(r.created_at).toLocaleString() : "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `rsvps-${dateStamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  if (checkingSession) {
    return (
      <main className="max-w-md mx-auto px-4 py-24 text-center text-[var(--muted)]">
        Loading…
      </main>
    );
  }

  if (!supabase) {
    return (
      <main className="max-w-xl mx-auto px-4 py-24 text-center text-[var(--muted)]">
        Supabase isn&rsquo;t connected yet. Please add your credentials to .env.local — see README.md.
      </main>
    );
  }

  const total = rsvps.length;
  const yesCount = rsvps.filter((r) => r.attending === "yes").length;
  const noCount = rsvps.filter((r) => r.attending === "no").length;

  const visibleRsvps = rsvps
    .filter((r) => {
      if (attendingFilter !== "all" && r.attending !== attendingFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const haystack = `${r.full_name || ""} ${r.email || ""} ${r.phone || ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      let av = a[sortKey];
      let bv = b[sortKey];

      if (sortKey === "created_at") {
        av = av ? new Date(av).getTime() : 0;
        bv = bv ? new Date(bv).getTime() : 0;
      } else {
        av = (av || "").toString().toLowerCase();
        bv = (bv || "").toString().toLowerCase();
      }

      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-14">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <p className="section-title">Admin</p>
          <h1 className="serif text-2xl sm:text-4xl mt-2">RSVP dashboard</h1>
          {userEmail && (
            <p className="mt-1 text-sm text-[var(--muted)] break-all">Signed in as {userEmail}</p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <a
            href="/"
            className="btn-ghost px-5 py-2.5 rounded-full text-sm font-semibold inline-flex items-center justify-center gap-2"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M3 11l9-8 9 8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 10v10a1 1 0 001 1h4a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h4a1 1 0 001-1V10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to site
          </a>
          <button className="btn-ghost px-5 py-2.5 rounded-full text-sm font-semibold" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8 sm:mb-10">
        <div className="countdown-box"><b>{total}</b><span>Total RSVPs</span></div>
        <div className="countdown-box"><b>{yesCount}</b><span>Attending</span></div>
        <div className="countdown-box"><b>{noCount}</b><span>Not attending</span></div>
      </div>

      <div className="soft-card rounded-[2rem] p-4 sm:p-10 reveal">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <div>
            <p className="section-title">Responses</p>
            <h2 className="serif text-xl sm:text-2xl mt-2">All replies</h2>
          </div>
          <button
            className="btn-ghost w-full sm:w-auto px-5 py-2.5 rounded-full text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"
            onClick={handleExportCsv}
            disabled={visibleRsvps.length === 0}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 3v12m0 0l-4-4m4 4l4-4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Export CSV
          </button>
        </div>

        <div className="flex flex-col gap-3 mb-6 mt-4">
          <input
            type="text"
            className="edit-input w-full sm:max-w-[260px]"
            placeholder="Search name, email, or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="radio-row" role="radiogroup" aria-label="Filter by attendance">
              {[
                { value: "all", label: "All" },
                { value: "yes", label: "Attending" },
                { value: "no", label: "Not attending" },
              ].map((opt) => (
                <label key={opt.value}>
                  <input
                    type="radio"
                    name="attendingFilter"
                    value={opt.value}
                    checked={attendingFilter === opt.value}
                    onChange={() => setAttendingFilter(opt.value)}
                  />
                  <span className="opt">{opt.label}</span>
                </label>
              ))}
            </div>
            <span className="text-xs text-[var(--muted)] whitespace-nowrap">
              Showing {visibleRsvps.length} of {total}
            </span>
          </div>
        </div>

        {loading && <p className="text-[var(--muted)]">Loading responses…</p>}
        {error && <p className="text-sm text-[#a13f3a]" role="alert">{error}</p>}

        {!loading && !error && rsvps.length === 0 && (
          <p className="text-[var(--muted)]">No RSVPs yet.</p>
        )}

        {!loading && !error && rsvps.length > 0 && visibleRsvps.length === 0 && (
          <p className="text-[var(--muted)]">No RSVPs match your search/filter.</p>
        )}

        {!loading && !error && visibleRsvps.length > 0 && (
          <div className="rsvp-table-scroll">
            <table className="rsvp-table w-full text-sm text-left">
              <thead>
                <tr className="border-b border-[var(--gold-soft)] text-[var(--muted)]">
                  <th className="py-2 pr-4 font-medium cursor-pointer select-none" onClick={() => toggleSort("full_name")}>
                    Name{sortIndicator("full_name")}
                  </th>
                  <th className="py-2 pr-4 font-medium cursor-pointer select-none" onClick={() => toggleSort("phone")}>
                    Phone{sortIndicator("phone")}
                  </th>
                  <th className="py-2 pr-4 font-medium cursor-pointer select-none" onClick={() => toggleSort("email")}>
                    Email{sortIndicator("email")}
                  </th>
                  <th className="py-2 pr-4 font-medium cursor-pointer select-none" onClick={() => toggleSort("attending")}>
                    Attending{sortIndicator("attending")}
                  </th>
                  <th className="hidden sm:table-cell py-2 pr-4 font-medium cursor-pointer select-none" onClick={() => toggleSort("created_at")}>
                    Submitted{sortIndicator("created_at")}
                  </th>
                  <th className="py-2 pr-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleRsvps.map((r) => {
                  const isEditing = editingId === r.id;
                  return (
                    <tr key={r.id} className="border-b border-[var(--gold-soft)]/40 align-top">
                      {isEditing ? (
                        <>
                          <td className="py-3 pr-4" data-label="Name">
                            <input
                              className="edit-input"
                              type="text"
                              value={editForm.full_name}
                              onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))}
                            />
                          </td>
                          <td className="py-3 pr-4" data-label="Phone">
                            <input
                              className="edit-input"
                              type="tel"
                              value={editForm.phone}
                              onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                            />
                          </td>
                          <td className="py-3 pr-4" data-label="Email">
                            <input
                              className="edit-input"
                              type="email"
                              value={editForm.email}
                              onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                            />
                          </td>
                          <td className="py-3 pr-4" data-label="Attending">
                            <select
                              className="edit-input"
                              value={editForm.attending}
                              onChange={(e) => setEditForm((f) => ({ ...f, attending: e.target.value }))}
                            >
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
                            </select>
                          </td>
                          <td className="hidden sm:table-cell py-3 pr-4 text-[var(--muted)]" data-label="Submitted">
                            {r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
                          </td>
                          <td className="py-3 pr-4" data-label="Actions">
                            <div className="flex flex-col gap-2 items-start">
                              <div className="flex gap-2 w-full">
                                <button
                                  className="btn-primary px-3 py-2 sm:py-1.5 rounded-full text-xs font-semibold disabled:opacity-60 flex-1 sm:flex-none"
                                  onClick={() => saveEdit(r.id)}
                                  disabled={savingEdit}
                                >
                                  {savingEdit ? "Saving…" : "Save"}
                                </button>
                                <button
                                  className="btn-ghost px-3 py-2 sm:py-1.5 rounded-full text-xs font-semibold flex-1 sm:flex-none"
                                  onClick={cancelEdit}
                                  disabled={savingEdit}
                                >
                                  Cancel
                                </button>
                              </div>
                              {editError && (
                                <span className="text-xs text-[#a13f3a]">{editError}</span>
                              )}
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 pr-4" data-label="Name">{r.full_name}</td>
                          <td className="py-3 pr-4" data-label="Phone">{r.phone}</td>
                          <td className="py-3 pr-4 break-all" data-label="Email">{r.email}</td>
                          <td className="py-3 pr-4" data-label="Attending">
                            <span className={`pill px-3 py-1 rounded-full text-xs font-semibold ${r.attending === "yes" ? "" : "opacity-70"}`}>
                              {r.attending === "yes" ? "✓ Yes" : "✕ No"}
                            </span>
                          </td>
                          <td className="hidden sm:table-cell py-3 pr-4 text-[var(--muted)]" data-label="Submitted">
                            {r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
                          </td>
                          <td className="py-3 pr-4" data-label="Actions">
                            <div className="flex flex-col gap-2 items-start">
                              <div className="flex gap-2 w-full">
                                <button
                                  className="btn-ghost px-3 py-2 sm:py-1.5 rounded-full text-xs font-semibold flex-1 sm:flex-none"
                                  onClick={() => startEdit(r)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="btn-ghost px-3 py-2 sm:py-1.5 rounded-full text-xs font-semibold text-[#a13f3a] disabled:opacity-60 flex-1 sm:flex-none"
                                  onClick={() => handleDelete(r.id)}
                                  disabled={deletingId === r.id}
                                >
                                  {deletingId === r.id ? "Deleting…" : "Delete"}
                                </button>
                              </div>
                              {rowError[r.id] && (
                                <span className="text-xs text-[#a13f3a]">{rowError[r.id]}</span>
                              )}
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}