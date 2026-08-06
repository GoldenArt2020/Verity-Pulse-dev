// src/components/layout/ChannelSwitcher.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Plus, Video } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useChannelId } from "@/hooks/useChannelId";
import { ChannelOnboarding } from "@/components/discover/ChannelOnboarding";

const MAX_CHANNELS = 6;

export function ChannelSwitcher() {
  const { channels, activeChannelRowId, switchChannel, loaded } = useChannelId();
  const [open, setOpen] = useState(false);
  const [addingChannel, setAddingChannel] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!loaded || channels.length === 0) return null;

  const activeChannel = channels.find((c) => c.id === activeChannelRowId);
  const atLimit = channels.length >= MAX_CHANNELS;

  async function handleSwitch(id: string) {
    if (id === activeChannelRowId) {
      setOpen(false);
      return;
    }
    await switchChannel(id);
    setOpen(false);
    window.location.reload(); // simplest way to ensure all channel-scoped data refetches
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 items-center gap-2 rounded-[12px] border border-white/[0.06] bg-[#18181B] px-3 text-sm text-[#FAFAFA] transition-colors hover:border-white/[0.12]"
      >
        <Video className="h-4 w-4 text-[#71717A]" />
        <span className="max-w-[160px] truncate font-medium">
          {activeChannel?.channelName ?? "Select channel"}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-[#71717A] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-[14px] border border-white/[0.06] bg-[#18181B] shadow-xl"
          >
            <div className="max-h-72 overflow-y-auto py-1">
              {channels.map((c) => {
                const isActive = c.id === activeChannelRowId;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSwitch(c.id)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm text-[#FAFAFA] transition-colors hover:bg-white/[0.04]"
                  >
                    <span className="truncate">{c.channelName}</span>
                    {isActive && <Check className="h-4 w-4 shrink-0 text-blue-500" />}
                  </button>
                );
              })}
            </div>

            <div className="border-t border-white/[0.06] p-1">
              <button
                onClick={() => {
                  if (atLimit) return;
                  setOpen(false);
                  setAddingChannel(true);
                }}
                disabled={atLimit}
                title={atLimit ? `You've reached the ${MAX_CHANNELS}-channel limit` : undefined}
                className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2.5 text-left text-sm text-[#A1A1AA] transition-colors hover:bg-white/[0.04] hover:text-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <Plus className="h-4 w-4" />
                {atLimit ? `Limit reached (${MAX_CHANNELS}/${MAX_CHANNELS})` : "Add another channel"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {addingChannel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-[20px] border border-white/[0.06] bg-[#0A0A0B] p-2">
            <button
              onClick={() => setAddingChannel(false)}
              className="absolute right-4 top-4 z-10 text-sm text-[#71717A] hover:text-[#FAFAFA]"
            >
              Cancel
            </button>
            <ChannelOnboarding onConnected={() => window.location.reload()} />
          </div>
        </div>
      )}
    </div>
  );
}