import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Helper to trim surrounding quotes from env values (common when using .env files).
 */
function cleanEnv(value?: string): string | undefined {
  if (!value) return undefined;
  return value.replace(/^['"]|['"]$/g, "");
}

/**
 * Creates a server-side Supabase client using SUPABASE_SERVICE_ROLE_KEY for privileged write operations.
 * IMPORTANT: This client MUST ONLY be instantiated and used in server-side contexts.
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabaseUrl = cleanEnv(rawUrl);
  const serviceKey = cleanEnv(rawServiceKey);

  if (!supabaseUrl || !serviceKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Creates a Supabase client using public credentials for read‑only operations.
 */
export function getSupabaseClient(): SupabaseClient | null {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabaseUrl = cleanEnv(rawUrl);
  const anonKey = cleanEnv(rawAnonKey);

  if (!supabaseUrl || !anonKey) {
    return null;
  }

  return createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
