"use client";

import { AlertTriangle, Download, LogOut, Trash2 } from "lucide-react";
import { useState } from "react";

export function DangerZoneCard() {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="glass-card rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-rose-400" />
        <h3 className="text-[14px] font-semibold text-white">Danger Zone</h3>
      </div>

      <p className="mt-2 text-[11.5px] text-slate-400">
        These actions are permanent and cannot be undone. Proceed with caution.
      </p>

      <div className="mt-4 space-y-2">
        <button className="flex w-full items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5 text-left text-[12.5px] font-medium text-slate-300 hover:bg-slate-800/50">
          <Download className="h-4 w-4 text-slate-500" /> Export All Data
        </button>

        <button className="flex w-full items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5 text-left text-[12.5px] font-medium text-slate-300 hover:bg-slate-800/50">
          <LogOut className="h-4 w-4 text-slate-500" /> Deactivate Account
        </button>

        <button
          onClick={() => setConfirmDelete(true)}
          className="flex w-full items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-left text-[12.5px] font-medium text-rose-400 hover:bg-rose-500/20"
        >
          <Trash2 className="h-4 w-4" /> Delete Workspace
        </button>
      </div>

      {confirmDelete && (
        <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3">
          <p className="text-[12px] font-medium text-rose-300">Are you sure? This will permanently delete your workspace and all associated data.</p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 rounded-lg border border-slate-700 py-1.5 text-[11.5px] font-medium text-slate-300 hover:bg-slate-800/50"
            >
              Cancel
            </button>
            <button className="flex-1 rounded-lg bg-rose-500 py-1.5 text-[11.5px] font-semibold text-white hover:bg-rose-600">
              Confirm Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}