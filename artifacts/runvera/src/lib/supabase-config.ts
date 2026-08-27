/**
 * Supabase configuration for Runvera.
 *
 * Reads Vite env vars and validates them before the app initializes.
 * When env vars are missing the app falls back to DevAuthProvider
 * so the dashboard is always accessible during development.
 */

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function isValidUrl(url: string | undefined): url is string {
  if (!url || typeof url !== "string") return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isValidKey(key: string | undefined): key is string {
  if (!key || typeof key !== "string") return false;
  return key.trim().length > 10;
}

export const supabaseUrl = isValidUrl(rawUrl) ? rawUrl.trim() : "";
export const supabaseAnonKey = isValidKey(rawKey) ? rawKey.trim() : "";

/**
 * Whether Supabase is properly configured. When false the app uses
 * DevAuthProvider so the dashboard is always accessible without
 * external auth.
 */
export const supabaseConfigured = supabaseUrl !== "" && supabaseAnonKey !== "";
