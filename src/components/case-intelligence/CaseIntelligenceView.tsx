"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useCase } from "@/hooks/useCase";
import { CaseHeader } from "@/components/case-intelligence/CaseHeader";
import { CaseTabs } from "@/components/case-intelligence/CaseTabs";
import { CaseTimeline } from "@/components/case-intelligence/CaseTimeline";
import { KeyDocuments } from "@/components/case-intelligence/KeyDocuments";
import { TopIntelligenceSources } from "@/components/case-intelligence/TopIntelligenceSources";
import { QuickIntelligence } from "@/components/case-intelligence/QuickIntelligence";
import { NarrativeGapsFound } from "@/components/case-intelligence/NarrativeGapsFound";
import { AudienceInterestChart } from "@/components/case-intelligence/AudienceInterestChart";
import { ResearchStatusBar } from "@/components/case-intelligence/ResearchStatusBar";
import { CoverageMap } from "@/components/case-intelligence/CoverageMap";
import { AngleSaturationTable } from "@/components/case-intelligence/AngleSaturationTable";
import { UntappedAngles } from "@/components/case-intelligence/UntappedAngles";
import { EditorialFeedback } from "@/components/case-intelligence/EditorialFeedback";

interface CaseIntelligenceViewProps {
  caseId: string;
  backHref: string;
  backLabel: string;
}

/**
 * Full case-intelligence body: research trigger, loading/error states, and
 * the header/tabs/timeline/analytics grid. Shared by both the standalone
 * case-analyzer route and the projects detail route, so a case looks and
 * behaves identically whether you got there from Discover or from a saved
 * Project — only the "back" link differs.
 */
export function CaseIntelligenceView({ caseId, backHref, backLabel }: CaseIntelligenceViewProps) {
  const { caseData, loading, error } = useCase(caseId);

  const [researching, setResearching] = useState(false);
  const [researchError, setResearchError] = useState<string | null>(null);
  const [researchDone, setResearchDone] = useState(false);

  // Hard guard against re-triggering research. This is a ref, not state —
  // it persists across renders without causing re-renders itself, so it
  // reliably blocks duplicate calls even if `caseData` changes reference
  // on refetch.
  const researchTriggeredRef = useRef(false);

  const isStub = !loading && !!caseData && caseData.summary === null;

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
      .catch((err) => {
        setResearchError(err instanceof Error ? err.message : "Research failed");
      })
      .finally(() => setResearching(false));
  }, [isStub, caseData]);

  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-800/60 bg-[rgb(4,9,22)] px-8 py-4">
        <Link
          href={backHref}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-slate-200"
        >
          <ChevronLeft className="h-4 w-4" />
          {backLabel}
        </Link>
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
            <p className="mt-1 text-sm text-slate-400">
              Gathering sources, YouTube coverage, and building an editorial recommendation.
              This usually takes under a minute.
            </p>
          </div>
          {researchError && (
            <p className="mt-2 text-sm text-rose-400">{researchError}</p>
          )}
        </div>
      )}

      {!loading && !error && caseData && (!isStub || researchDone) && (
        <div className="grid grid-cols-[1fr_340px] gap-4 p-6">
          <div className="space-y-4">
            <CaseHeader caseData={caseData} />
            <CaseTabs />
            <CaseTimeline caseId={caseData.id} />

            <div className="grid grid-cols-2 gap-4">
              <KeyDocuments caseId={caseData.id} />
              <TopIntelligenceSources caseId={caseData.id} />
            </div>

            <ResearchStatusBar />

            <div className="grid grid-cols-2 gap-4">
              <CoverageMap caseId={caseData.id} />
              <AngleSaturationTable caseId={caseData.id} />
            </div>

            <EditorialFeedback caseId={caseData.id} />

            <UntappedAngles caseId={caseData.id} />
          </div>

          <div className="space-y-4">
            <QuickIntelligence />
            <NarrativeGapsFound />
            <AudienceInterestChart />
          </div>
        </div>
      )}
    </div>
  );
}