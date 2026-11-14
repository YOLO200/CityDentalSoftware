import { createClient } from "@supabase/supabase-js";
import { monitoredFetch } from "./sentry";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local");
}

// monitoredFetch reports 5xx and bug-class errors (missing column/table, bad
// enum value…) to Sentry, then returns the response unchanged.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: monitoredFetch },
});
