import { client } from "@/lib/dataClient";
import type { AuthUser } from "@aws-amplify/auth";




/**
 * Ensures a UserProfile row exists for the signed-in Cognito user.
 * Uses the Cognito sub (user.userId) as the UserProfile's id so it's
 * stable and doesn't require a lookup-by-email round trip.
 * Safe to call on every load — only creates on first call per user.
 */
export async function ensureUserProfile(user: AuthUser) {
  const id = user.userId;
  const email = user.signInDetails?.loginId ?? "";




  const existing = await client.models.UserProfile.get({ id });
  if (existing.data) return existing.data;




  const created = await client.models.UserProfile.create({
    id,
    email,
    subscription: "FREE",
    lastLogin: new Date().toISOString(),
  });




  return created.data;
}





