"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck, Tv } from "lucide-react";

/** Maps callback `reason` codes to something a user can act on. */
const ERROR_MESSAGES: Record<string, string> = {
  access_denied:
    "You declined the permissions, or this Google account isn't approved for access yet.",
  missing_code: "Google didn't return an authorization code. Please try again.",
  state_mismatch: "The connection attempt expired. Please try again.",
  not_authenticated: "Your session expired. Sign in again, then reconnect.",
  oauth_not_configured: "YouTube connection isn't configured on the server yet.",
  token_exchange_failed: "Google rejected the connection. Please try again.",
  no_access_token: "Google didn't return an access token. Please try again.",
  channel_lookup_failed: "Couldn't read your channel from YouTube. Please try again.",
  no_channel: "This Google account doesn't have a YouTube channel. Try a different account.",
  no_refresh_token:
    "Channel verified, but Google didn't grant long-term analytics access. Revoke this app in your Google account settings, then reconnect.",
  db_update_failed: "Verified your channel, but saving the connection failed.",
};

export function ConnectRealChannelCard() {
  const searchParams = useSearchParams();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    if (connecting) return;
    setConnecting(true);
    setError(null);
    try {
      const res = await fetch("/api/youtube/channel-connect-url");
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "Could not start the YouTube connection.");
        setConnecting(false);
        return;
      }
      // Full navigation, not router.push — this leaves the app for Google.
      window.location.href = data.url;
    } catch {
      setError("Could not start the YouTube connection.");
      setConnecting(false);
    }
  }

  const failed = searchParams.get("connect") === "error";
  const reason = searchParams.get("reason");
  const failureMessage = failed
    ? reason
      ? ERROR_MESSAGES[reason] ?? `Couldn't verify your channel (${reason}). Please try again.`
      : "Couldn't verify your channel. Please try again."
    : null;

  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-emerald-400" />
        <h3 className="text-base font-semibold text-white">Verify channel ownership</h3>
      </div>

      <p className="mt-2 text-xs text-slate-400">
        Sign in with the Google account that owns your channel to confirm it&apos;s yours and unlock
        real performance data — click-through rate, retention curves, and audience behaviour. Adding
        a channel by handle only gives public data.
      </p>

      <button
        onClick={handleConnect}
        disabled={connecting}
        className="mt-4 flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-xs font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {connecting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Tv className="h-3.5 w-3.5" />
        )}
        {connecting ? "Opening Google…" : "Connect with Google"}
      </button>

      {failureMessage && (
        <p className="mt-3 text-xs text-rose-400" role="alert">
          {failureMessage}
        </p>
      )}
      {error && (
        <p className="mt-3 text-xs text-rose-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}