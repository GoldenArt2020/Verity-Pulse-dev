"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check, Radio } from "lucide-react";
import { useChannelId } from "@/hooks/useChannelId";

export function ChannelSwitcher() {
  const { channels, activeChannelRowId, loaded, switchChannel } = useChannelId();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!loaded || channels.length === 0) {
    return null;
  }

  const activeChannel = channels.find((c) => c.id === activeChannelRowId);

  // Nothing to switch between — just show the name, no dropdown affordance.
  if (channels.length === 1) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-slate-800/60 bg-slate-900/40 px-3 py-2 text-xs font-medium text-slate-300">
        <Radio className="h-3.5 w-3.5 text-emerald-400" />
        {activeChannel?.channelName ?? "Channel"}
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-slate-800/60 bg-slate-900/40 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 hover:bg-slate-800/50"
      >
        <Radio className="h-3.5 w-3.5 text-emerald-400" />
        {activeChannel?.channelName ?? "Select channel"}
        <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-slate-800/60 bg-[rgb(10,15,30)] p-1.5 shadow-xl">
          {channels.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                switchChannel(c.id);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-300 hover:bg-slate-800/60"
            >
              <span className="truncate">{c.channelName}</span>
              {c.id === activeChannelRowId && <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}