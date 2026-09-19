import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * The UI runs against local seeded data until these two environment variables
 * are supplied. Keeping this boundary tiny makes the demo deployable without
 * leaking credentials into the client bundle.
 */
export const supabase = url && key ? createClient(url, key) : null;

export const hasSupabase = Boolean(supabase);
