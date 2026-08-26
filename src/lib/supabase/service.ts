import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for contexts with no incoming HTTP
 * request — e.g. Trigger.dev background tasks — where the cookie-based
 * createClient() in ./server.ts cannot work (Next.js's cookies() throws
 * when called outside a request scope).
 *
 * This bypasses RLS entirely, which is safe ONLY because every caller
 * here already has an explicitly-verified userId (verified by the
 * Vercel route that reserved the generation and enqueued the task)
 * rather than deriving identity from a session. It must never be used
 * to serve a request directly from the browser, and the service role
 * key must never be exposed client-side.
 */
export function createServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must both be set");
  }
  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}