"use client";

import { useState } from "react";
import { AtSign, Loader2, Check } from "lucide-react";
import { useChannelId } from "@/hooks/useChannelId";

export function ChannelOnboarding() {
  const { saveChannel } = useChannelId();
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    if (!handle.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/youtube/resolve-handle?handle=${encodeURIComponent(handle.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Channel not found");
      saveChannel(data.channelId, handle.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-8 py-24 text-center">
      <h1 className="text-[40px] font-bold text-[#FAFAFA]">Discover</h1>
      <p className="mt-3 text-lg text-[#A1A1AA]">Let&apos;s learn about your channel.</p>
      <p className="mt-4 text-sm leading-relaxed text-[#A1A1AA]">
        The more VerityPulse understands your content, the better it can recommend stories your audience is most likely to watch.
      </p>

      <div className="mt-10 w-full">
        <div className="relative">
          <AtSign className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71717A]" />
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConnect()}
            placeholder="yourchannelhandle"
            className="h-14 w-full rounded-[18px] border border-white/[0.06] bg-[#18181B] pl-11 pr-5 text-[#FAFAFA] placeholder:text-[#71717A] transition-colors focus:border-blue-500/50 focus:outline-none"
          />
        </div>

        {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

        <button
          onClick={handleConnect}
          disabled={loading || !handle.trim()}
          className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-[14px] bg-blue-500 font-semibold text-white transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {loading ? "Connecting..." : "Connect Channel"}
        </button>
      </div>
    </div>
  );
}