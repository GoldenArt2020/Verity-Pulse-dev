import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — bypasses Row Level Security entirely.
 *
 * ONLY use this in trusted server-to-server contexts that have already
 * verified the caller through some other means (e.g. the CRON_SECRET
 * bearer check on the news-poll route). NEVER use this for anything
 * reachable directly from a logged-in user's browser session.
 *
 * Why this exists: the normal cookie-based `createClient()` in
 * `./server.ts` has NO session at all when called from a cron job (no
 * browser, no cookies were ever sent — GitHub Actions just does a bare
 * `curl -X POST`). If a table has RLS requiring `auth.uid()` to be set,
 * every read/write from that context fails silently — Supabase returns
 * an error object rather than throwing, so nothing crashes, it just
 * quietly never persists anything. This client is how server-only
 * background jobs actually get real access.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL — service client cannot be created");
  }
  if (!serviceKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY — add it in Vercel env vars (Supabase dashboard → Project Settings → API → service_role secret) for the service client to work"
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}