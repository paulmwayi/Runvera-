import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Lazily created Supabase client.
 * Returns null when env vars are missing so the app never crashes at import time.
 * Consumers should check `supabase !== null` before calling Supabase methods.
 */
let _client: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> | null {
  if (_client) return _client;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  _client = createClient<Database>(supabaseUrl, supabaseAnonKey);
  return _client;
}

/**
 * Eagerly resolved client for convenience.
 * Will be null when env vars are missing.
 */
export const supabase: SupabaseClient<Database> | null = (() => {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
})();
