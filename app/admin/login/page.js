"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // If already signed in, skip straight to the dashboard.
  useEffect(() => {
    if (!supabase) {
      setCheckingSession(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/admin");
      } else {
        setCheckingSession(false);
      }
    });
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!supabase) {
      setError(
        "Supabase isn't connected yet. Please add your credentials to .env.local — see README.md."
      );
      return;
    }

    setLoading(true);

    // The trick: convert the username into a fake email format 
    // that Supabase will accept.
    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, "");
    const fakeEmail = `${cleanUsername}@ifeniyi.admin`;

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password,
    });
    
    setLoading(false);

    if (signInError) {
      setError("Incorrect username or password.");
      return;
    }

    router.replace("/admin");
  }

  if (checkingSession) {
    return (
      <main className="max-w-md mx-auto px-4 py-24 text-center text-[var(--muted)]">
        Loading…
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="soft-card rounded-[2rem] p-6 sm:p-10 reveal">
        <p className="section-title">Admin</p>
        <h1 className="serif text-3xl mt-2">Sign in</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Sign in to view RSVP responses.
        </p>

        <form className="form mt-7" onSubmit={handleSubmit} noValidate>
          {/* Changed from Email to Username */}
          <div className="field mb-5">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="field mb-5">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            className="btn-primary px-6 py-3 rounded-full font-semibold disabled:opacity-60 w-full"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          {error && (
            <p className="mt-4 text-sm text-[#a13f3a]" role="alert">
              {error}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}