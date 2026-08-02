"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";
import type { CaseCategory } from "@/components/home/CaseVisual";

interface ContinueWorkingItem {
  id: string;
  name: string;
  category: CaseCategory;
  phase: string;
  phaseColor: string;
  progress: number;
  lastEdited: string;
  href: string;
}

const PHASE_COLOR: Record<string, string> = {
  Research: "#7C3AED",
  Script: "#F97316",
  Optimization: "#16A34A",
};

const PHASE_PATH: Record<string, string> = {
  Research: "/research",
  Script: "/create",
  Optimization: "/optimize",
};

const KNOWN_CATEGORIES: CaseCategory[] = [
  "missing-person",
  "unsolved-murder",
  "court-case",
  "cold-case",
  "general",
];

function toCategory(raw: string | null): CaseCategory {
  return KNOWN_CATEGORIES.includes(raw as CaseCategory) ? (raw as CaseCategory) : "general";
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString();
}

export function useContinueWorking(limit = 3) {
  const { user } = useAuthUser();
  const [items, setItems] = useState<ContinueWorkingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: dbError } = await supabase
      .from("user_case_progress")
      .select("id, case_id, phase, progress_percent, updated_at, cases(name, category)")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (dbError) {
      setError(dbError.message);
      setLoading(false);
      return;
    }

    const mapped: ContinueWorkingItem[] = (data ?? []).map((row: any) => ({
      id: row.case_id,
      name: row.cases?.name ?? "Untitled Case",
      category: toCategory(row.cases?.category ?? null),
      phase: row.phase,
      phaseColor: PHASE_COLOR[row.phase] ?? "#71717A",
      progress: row.progress_percent,
      lastEdited: formatRelativeTime(row.updated_at),
      href: `${PHASE_PATH[row.phase] ?? "/research"}/${row.case_id}`,
    }));

    setItems(mapped);
    setLoading(false);
  }, [user, limit]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, error, refresh: load };
}