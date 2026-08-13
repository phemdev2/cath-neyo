import { supabaseAdmin } from "../../lib/supabaseAdmin";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!supabaseAdmin) {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-20">
        <div className="soft-card rounded-[2rem] p-8">
          <p className="section-title">Dashboard</p>
          <h1 className="serif text-3xl mt-2">Not connected yet</h1>
          <p className="mt-3 text-[var(--ink-soft)]">
            Add <code>SUPABASE_SERVICE_ROLE_KEY</code> to <code>.env.local</code>, then restart the dev server.
            See README.md for where to find it in Supabase.
          </p>
        </div>
      </main>
    );
  }

  const { data, error } = await supabaseAdmin
    .from("rsvps")
    .select("id, full_name, phone, email, attending, created_at")
    .order("created_at", { ascending: false });

  return <DashboardClient rsvps={data || []} fetchError={error?.message || null} />;
}
