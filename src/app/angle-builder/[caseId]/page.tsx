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
import type { TitleIdea } from "@/lib/titleIdeas";

export interface AngleScores {
  searchDemand: number;
  competition: number;
  emotionalImpact: number;
  originality: number;
  audienceMatch: number;
}

export interface FindingItem {
  title: string;
  snippet: string;
  url: string;
  publishedDate?: string;
}

export interface GeneratedAngle {
  id: string;
  title: string;
  coreQuestion: string;
  whyItWorks: string;
  researchFocus: string[];
  openingHook: string;
  scores: AngleScores;
  script: string | null;
  scriptGeneratedAt: string | null;
  scriptWordCount?: number | null;
  seo?: { title: string | null; description: string | null; tags: string[] } | null;
  caseWriteup: string;
  channelFit: string;
  whyWorkOnIt: string;
  curiosityGaps: string[];
  mouthWateringSurprises: string[];
  latestFindings: FindingItem[];
  titleIdeas: TitleIdea[];
}

export default function AngleBuilderPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = use(params);
  const { caseData, loading, error, refetch } = useCase(caseId);

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

  // Which step of the Angle Builder workflow is active. Advances
  // automatically to "Analyze & Refine" (index 1) the moment a script
  // finishes generating for the selected angle.
  const [step, setStep] = useState(0);

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
        await refetch();
        setResearchDone(true);
      })
      .catch((err) => setResearchError(err instanceof Error ? err.message : "Research failed"))
      .finally(() => setResearching(false));
  }, [isStub, caseData, refetch]);

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
      setStep(0);
    } catch (err) {
      setAnglesError(err instanceof Error ? err.message : "Failed to generate angles");
    } finally {
      setAnglesLoading(false);
    }
  }

  function handleRegenerateClick() {
    if (angles.length > 0) {
      const hasScripts = angles.some((a) => !!a.script);
      const message = hasScripts
        ? "Regenerating will archive these angles, including ones with scripts already written. Archived angles and scripts stay saved under the case's project — they just won't show here anymore. Continue?"
        : "Regenerating will replace these angles with a new batch. Continue?";
      if (!confirm(message)) return;
    }
    handleGenerateAngles();
  }

  useEffect(() => {
    if (!researched || !caseData || anglesTriggeredRef.current) return;
    anglesTriggeredRef.current = true;

    setAnglesLoading(true);
    fetch(`/api/case/${caseData.id}/angles`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load angles");
        if ((data.angles ?? []).length > 0) {
          setAngles(data.angles);
          setAnglesLoading(false);
        } else {
          handleGenerateAngles();
        }
      })
      .catch(() => {
        handleGenerateAngles();
      });
  }, [researched, caseData]);

  function handleScriptGenerated(
    angleId: string,
    script: string,
    wordCount: number,
    seo: { description: string; keywords: string[] } | null
  ) {
    setAngles((prev) =>
      prev.map((a) =>
        a.id === angleId
          ? {
              ...a,
              script,
              scriptGeneratedAt: new Date().toISOString(),
              scriptWordCount: wordCount,
              seo: seo ? { title: null, description: seo.description, tags: seo.keywords } : null,
            }
          : a
      )
    );
    // Script is ready to review — move the workflow into Analyze & Refine.
    setStep(1);
  }

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
        <div className="mx-auto max-w-[1400px] space-y-4 p-6">
          <AngleBuilderHeader caseData={caseData} onRegenerate={handleRegenerateClick} regenerating={anglesLoading} />
          <StepTabs active={step} onChange={setStep} />

          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_340px] gap-4">
            <GeneratedAnglesList
              angles={angles}
              loading={anglesLoading}
              error={anglesError}
              selectedIndex={selectedIndex}
              onSelect={setSelectedIndex}
              onRegenerate={handleRegenerateClick}
            />
            <SelectedAnglePanel
              angle={selectedAngle}
              onClear={() => setSelectedIndex(null)}
              caseId={caseData.id}
              onScriptGenerated={handleScriptGenerated}
            />
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