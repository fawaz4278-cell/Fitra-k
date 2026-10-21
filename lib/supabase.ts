import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client for use in Client Components.
 * For Server Components / Route Handlers use `createServerSupabase` from `lib/supabase-server.ts`.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
