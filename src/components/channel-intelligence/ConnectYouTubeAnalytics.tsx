"use client";

import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Drop this into the Channel Intelligence page below the channel input,
 * as before. It's a second, separate consent step — deliberately not
 * combined with channel connection.
 *
 * Usage: <ConnectYouTubeAnalytics channelRowId={channel.id} />
 */
export function ConnectYouTubeAnalytics({
  channelRowId,
  connected,
}: {
  channelRowId: string;
  connected?: boolean;
}) {
  async function handleConnectAnalytics() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "https://www.googleapis.com/auth/yt-analytics.readonly",
        queryParams: { access_type: "offline", prompt: "consent" },
        redirectTo: `${window.location.origin}/auth/analytics-connect-callback`,
      },
    });
  }

  if (connected) {
    return (
      <div className="flex items-center gap-2 rounded-[14px] border border-white/[0.06] bg-[#18181B] px-4 py-3 text-sm text-[#A1A1AA]">
        <ShieldCheck className="h-4 w-4 text-emerald-400" />
        YouTube Analytics connected
      </div>
    );
  }

  return (
    <div className="rounded-[14px] border border-white/[0.06] bg-[#18181B] p-4">
      <p className="text-sm text-[#FAFAFA]">YouTube Analytics</p>
      <p className="mt-1 text-xs text-[#71717A]">
        Grant analytics access to see real views, watch time, and subscriber
        data for this channel.
      </p>
      <button
        onClick={handleConnectAnalytics}
        className="mt-3 flex h-10 items-center justify-center gap-2 rounded-[10px] bg-blue-500 px-4 text-sm font-semibold text-white transition-transform hover:scale-[1.01] active:scale-[0.98]"
      >
        Connect YouTube Analytics
      </button>
    </div>
  );
}