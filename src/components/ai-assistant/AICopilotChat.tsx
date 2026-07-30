"use client";

import { useState } from "react";
import { Send, Sparkles } from "lucide-react";

export function AICopilotChat() {
  const [message, setMessage] = useState("");

  return (
    <div className="glass-card flex h-[520px] flex-col rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-blue-400" />
        <h3 className="text-[14px] font-semibold text-white">AI Copilot</h3>
      </div>

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto">
        <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-slate-800/60 px-4 py-2.5 text-[13px] text-slate-200">
          Ask me anything about your cases, research, or content strategy.
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask the copilot..."
          className="flex-1 bg-transparent text-[13px] text-white placeholder:text-slate-500 focus:outline-none"
        />
        <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-white hover:bg-blue-600">
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}