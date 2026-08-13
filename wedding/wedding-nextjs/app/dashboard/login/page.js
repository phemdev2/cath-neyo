"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/dashboard-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Incorrect password.");
    }
  }

  return (
    <main className="max-w-md mx-auto px-4 sm:px-6 py-20">
      <div className="soft-card rounded-[2rem] p-8 reveal">
        <p className="section-title">Dashboard</p>
        <h1 className="serif text-3xl mt-2">Enter password</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Private RSVP responses for Catherine &amp; Niyi.</p>

        <form className="form mt-6" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
            />
          </div>

          {error && <p className="mt-3 text-sm text-[#a13f3a]">{error}</p>}

          <button
            className="btn-primary mt-6 px-6 py-3 rounded-full font-semibold w-full disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? "Checking…" : "Enter"}
          </button>
        </form>
      </div>
    </main>
  );
}
