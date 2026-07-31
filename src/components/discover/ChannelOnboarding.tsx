"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AtSign, Check } from "lucide-react";
import { useChannelId } from "@/hooks/useChannelId";

const ANALYSIS_STEPS = [
  "Reading channel",
  "Analyzing videos",
  "Learning audience",
  "Building Creator DNA",
  "Generating recommendations",
];

export function ChannelOnboarding() {
  const { saveChannel } = useChannelId();
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  async function handleConnect() {
    if (!handle.trim()) return;
    setLoading(true);
    setError(null);
    setStepIndex(0);

    try {
      const res = await fetch(`/api/youtube/resolve-handle?handle=${encodeURIComponent(handle.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Channel not found");

      // Simulate the analysis pipeline steps while the real data resolves.
      // TODO: replace with real progress events once the backend analysis pipeline exists.
      for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
        await new Promise((r) => setTimeout(r, 500));
        setStepIndex(i + 1);
      }

      saveChannel(data.channelId, handle.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-8">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/[0.06] blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative mx-auto flex w-full max-w-md flex-col items-center text-center"
      >
        {!loading ? (
          <>
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
                disabled={!handle.trim()}
                className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-[14px] bg-blue-500 font-semibold text-white transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                Connect Channel
              </button>
            </div>
          </>
        ) : (
          <div className="w-full text-left">
            {ANALYSIS_STEPS.map((step, i) => {
              const done = i < stepIndex;
              const active = i === stepIndex;
              return (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="flex items-center justify-between border-b border-white/[0.06] py-4 last:border-0"
                >
                  <span className={`text-sm ${done || active ? "text-[#FAFAFA]" : "text-[#71717A]"}`}>
                    {step}
                  </span>
                  {done ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : active ? (
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/[0.06]">
                      <motion.div
                        className="h-full bg-blue-500"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-[#71717A]">...</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}