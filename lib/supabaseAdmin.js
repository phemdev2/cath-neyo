import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Server-only client. Uses the service role key, which bypasses Row Level
// Security. NEVER import this file from a "use client" component or
// anything that ships to the browser — the key must stay server-side only.
export const supabaseAdmin =
  url && serviceRoleKey ? createClient(url, serviceRoleKey) : null;