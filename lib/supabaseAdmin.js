import { createClient } from "@supabase/supabase-js";

// SERVER-ONLY. This uses the service role key, which bypasses Row Level
// Security entirely. Never import this file into a "use client" component —
// the service role key must never reach the browser. It intentionally does
// NOT have a NEXT_PUBLIC_ prefix so Next.js won't bundle it into client code.
//
// Get this key from: Supabase Dashboard → Project Settings → API →
// "service_role" (the secret one, not "anon public").
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;