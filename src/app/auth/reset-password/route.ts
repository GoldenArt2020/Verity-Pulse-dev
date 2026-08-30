// src/app/auth/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing point for the password-recovery email link. Establishes a session
 * from the recovery credential, then sends the user to the form where they
 * choose a new password.
 *
 * Unlike the YouTube OAuth callbacks, exchangeCodeForSession IS correct here:
 * the code in this URL was issued by Supabase, not by Google.
 *
 * Supabase has sent recovery links in two shapes over time — newer projects use
 * PKCE (?code=), older templates use ?token_hash=&type=recovery — so both are
 * handled rather than assuming one.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const errorDescription = searchParams.get("error_description");

  const fail = (reason: string) =>
    NextResponse.redirect(`${origin}/reset-password?error=${encodeURIComponent(reason)}`);

  // Supabase appends an error when the link is already used or past its expiry.
  if (errorDescription) return fail(errorDescription);

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[reset-password] code exchange failed:", error.message);
      return fail("This reset link is invalid or has expired.");
    }
  } else if (tokenHash && type === "recovery") {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
    if (error) {
      console.error("[reset-password] verifyOtp failed:", error.message);
      return fail("This reset link is invalid or has expired.");
    }
  } else {
    return fail("This reset link is missing its verification token.");
  }

  return NextResponse.redirect(`${origin}/reset-password`);
}