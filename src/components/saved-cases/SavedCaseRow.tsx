"use client";

import { useState } from "react";
import { Settings, Bookmark, MoreVertical } from "lucide-react";
import { SavedCase, CATEGORY_TAG_COLOR, STATUS_COLOR } from "@/constants/savedCases";
import { OpportunityScoreArc } from "./OpportunityScoreArc";

const TIER_LABEL_COLOR: Record<string, string> = {
  High: "text-emerald-400",
  Medium: "text-amber-400",
  Low: "text-purple-400",
};

export function SavedCaseRow({ item }: { item: SavedCase }) {
  const [checked, setChecked] = useState(false);

  return (
    <tr className="border-b border-slate-800/50 hover:bg-slate-800/30">
      <td className="w-10 px-4 py-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={() => setChecked((v) => !v)}
          className="h-4 w-4 rounded border-slate-600 bg-slate-900 accent-blue-500"
        />
      </td>

      <td className="px-2 py-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-slate-800">
            <div className="h-full w-full bg-gradient-to-br from-slate-700 to-slate-800" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-white">{item.name}</p>
            <div className="mt-1 flex items-center gap-1.5">
              {item.categories.map((c) => (
                <span
                  key={c}
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${CATEGORY_TAG_COLOR[c] ?? "bg-slate-700/40 text-slate-300"}`}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </td>

      <td className="px-2 py-3 text-[12.5px] text-slate-400">{item.categories[0]}</td>
      <td className="px-2 py-3 text-[12.5px] text-slate-400">{item.location}</td>

      <td className="px-2 py-3">
        <div className="flex flex-col items-center gap-0.5">
          <OpportunityScoreArc value={item.opportunityScore} tier={item.tier} />
          <span className={`text-[10px] font-semibold ${TIER_LABEL_COLOR[item.tier]}`}>{item.tier}</span>
        </div>
      </td>

      <td className="px-2 py-3">
        <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${STATUS_COLOR[item.status]}`}>
          {item.status}
        </span>
      </td>

      <td className="px-2 py-3 text-[11.5px] text-slate-500">
        <div>{item.savedOn}</div>
        <div>{item.savedTime}</div>
      </td>

      <td className="px-2 py-3">
        <div className="flex items-center justify-end gap-1.5">
          <button className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300">
            <Bookmark className="h-4 w-4" />
          </button>
          <button className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}