import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createSupabaseBrowserClient> | null = null;

const fallbackSupabaseUrl = "https://placeholder.supabase.co";
const fallbackSupabaseAnonKey = "placeholder-anon-key";

export function hasSupabaseBrowserEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function createBrowserClient() {
  if (!client) {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? fallbackSupabaseUrl;
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? fallbackSupabaseAnonKey;

    client = createSupabaseBrowserClient(
      supabaseUrl,
      supabaseAnonKey,
    );
  }
  return client;
}

// Backward-compatible alias for existing imports in client components/hooks.
export function createClient() {
  return createBrowserClient();
}
