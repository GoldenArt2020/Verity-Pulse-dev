// src/app/angle-builder/[caseId]/page.tsx
"use client";

import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useCase } from "@/hooks/useCase";
import { AngleBuilderHeader } from "@/components/angle-builder/AngleBuilderHeader";
import { StepTabs } from "@/components/angle-builder/StepTabs";
import { GeneratedAnglesList } from "@/components/angle-builder/GeneratedAnglesList";
import { SelectedAnglePanel } from "@/components/angle-builder/SelectedAnglePanel";
import { AudienceProfileMatch } from "@/components/angle-builder/AudienceProfileMatch";
import { AngleScoreBreakdown } from "@/components/angle-builder/AngleScoreBreakdown";
import { TitleIdeasList } from "@/components/angle-builder/TitleIdeasList";
import { AngleBuilderStatsBar } from "@/components/angle-builder/AngleBuilderStatsBar";

export interface AngleScores {
  searchDemand: number;
  competition: number;
  emotionalImpact: number;
  originality: number;
  audienceMatch: number;
}

export interface GeneratedAngle {
  title: string;
  coreQuestion: string;
  whyItWorks: string;
  researchFocus: string[];
  openingHook: string;
  scores: AngleScores;
}

export default function AngleBuilderPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = use(params);
  const { caseData, loading, error } = useCase(caseId);

  const [researching, setResearching] = useState(false);
  const [researchError, setResearchError] = useState<string | null>(null);
  const [researchDone, setResearchDone] = useState(false);
  const researchTriggeredRef = useRef(false);

  const [angles, setAngles] = useState<GeneratedAngle[]>([]);
  const [anglesLoading, setAnglesLoading] = useState(false);
  const [anglesError, setAnglesError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string | null>(null);
  const anglesTriggeredRef = useRef(false);

  const isStub = !loading && !!caseData && caseData.summary === null;
  const researched = !isStub || researchDone;

  useEffect(() => {
    if (!isStub || !caseData || researchTriggeredRef.current) return;
    researchTriggeredRef.current = true;
    setResearching(true);
    setResearchError(null);

    fetch("/api/case/research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId: caseData.id, caseName: caseData.name }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Research failed");
        setResearchDone(true);
      })
      .catch((err) => setResearchError(err instanceof Error ? err.message : "Research failed"))
      .finally(() => setResearching(false));
  }, [isStub, caseData]);

  async function handleGenerateAngles() {
    if (!caseData) return;
    setAnglesLoading(true);
    setAnglesError(null);
    setSelectedIndex(null);
    try {
      const res = await fetch("/api/case/generate-angle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: caseData.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate angles");
      setAngles(data.angles ?? []);
      setLastGeneratedAt(new Date().toISOString());
    } catch (err) {
      setAnglesError(err instanceof Error ? err.message : "Failed to generate angles");
    } finally {
      setAnglesLoading(false);
    }
  }

  useEffect(() => {
    if (!researched || !caseData || anglesTriggeredRef.current) return;
    anglesTriggeredRef.current = true;
    handleGenerateAngles();
  }, [researched, caseData]);

  const selectedAngle = selectedIndex !== null ? angles[selectedIndex] ?? null : null;

  return (
    <div>
      <div className="flex items-center gap-4 border-b border-slate-800/60 bg-[rgb(4,9,22)] px-8 py-4">
        <Link href="/discover" className="text-slate-400 hover:text-slate-200">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-display text-lg font-bold text-white">Angle Builder</h1>
          <p className="text-xs text-slate-500">Create compelling narrative angles that your audience will click, watch, and remember.</p>
        </div>
      </div>

      {loading && (
        <div className="p-6">
          <div className="h-40 animate-pulse rounded-2xl border border-slate-800/60 bg-slate-900/40" />
        </div>
      )}

      {error && (
        <div className="p-6">
          <p className="text-sm text-rose-400">Couldn&apos;t load this case: {error}</p>
        </div>
      )}

      {!loading && !error && !caseData && (
        <div className="p-6">
          <p className="text-sm text-slate-400">Case not found.</p>
        </div>
      )}

      {!loading && !error && caseData && isStub && !researchDone && (
        <div className="flex flex-col items-center justify-center gap-4 p-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          <div>
            <p className="text-lg font-semibold text-white">Researching {caseData.name}</p>
            <p className="mt-1 text-sm text-slate-400">Gathering sources and building an editorial baseline. This usually takes under a minute.</p>
          </div>
          {researchError && <p className="mt-2 text-sm text-rose-400">{researchError}</p>}
        </div>
      )}

      {!loading && !error && caseData && researched && (
        <div className="p-6 space-y-4">
          <AngleBuilderHeader caseData={caseData} onRegenerate={handleGenerateAngles} regenerating={anglesLoading} />
          <StepTabs />

          <div className="grid grid-cols-[1fr_1fr_340px] gap-4">
            <GeneratedAnglesList
              angles={angles}
              loading={anglesLoading}
              error={anglesError}
              selectedIndex={selectedIndex}
              onSelect={setSelectedIndex}
              onRegenerate={handleGenerateAngles}
            />
            <SelectedAnglePanel angle={selectedAngle} onClear={() => setSelectedIndex(null)} />
            <div className="space-y-4">
              <AudienceProfileMatch angle={selectedAngle} />
              <AngleScoreBreakdown angle={selectedAngle} />
              <TitleIdeasList angles={angles} />
            </div>
          </div>

          <AngleBuilderStatsBar angles={angles} loading={anglesLoading} lastGeneratedAt={lastGeneratedAt} />
        </div>
      )}
    </div>
  );
}