import { createClient } from "@/lib/supabase/client";

/**
 * Returns the channels.id values owned by the current user (there can be
 * more than one — multi-channel accounts are supported). Used to scope
 * "my cases" listing hooks to only the cases this user's channel(s) have
 * actually claimed, now that `cases` is shared platform-wide storage
 * rather than implicitly private.
 */
export async function getMyChannelIds(): Promise<string[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase.from("channels").select("id").eq("user_id", user.id);
  if (error || !data) return [];
  return data.map((c) => c.id);
}