import { randomBytes, createHash } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** Generates a new personal access token for the current session's user.
 * The raw token is only ever returned here, at creation time — only its
 * hash is stored, so it can never be recovered/displayed again later. */
export async function createApiToken(label: string): Promise<{ token: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const raw = `vp_${randomBytes(24).toString("hex")}`;
  const { error } = await supabase.from("api_tokens").insert({
    user_id: user.id,
    token_hash: hashToken(raw),
    label,
  });
  if (error) throw new Error(`Failed to create token: ${error.message}`);

  return { token: raw };
}

/** Resolves a bearer token to a user id. Uses the service-role client
 * deliberately — this runs on the unauthenticated MCP endpoint, before
 * any user session exists, so there's no session cookie to build a
 * normal session-bound client from. */
export async function resolveApiToken(raw: string): Promise<string | null> {
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await supabase
    .from("api_tokens")
    .select("id, user_id")
    .eq("token_hash", hashToken(raw))
    .maybeSingle();

  if (!data) return null;

  await supabase.from("api_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);
  return data.user_id;
}