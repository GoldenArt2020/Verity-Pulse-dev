"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
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

export default function CaseIntelligencePage() {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-800/60 bg-[rgb(4,9,22)] px-8 py-4">
        <Link
          href="/discover"
          className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-slate-200"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to opportunities
        </Link>
      </div>

      <div className="grid grid-cols-[1fr_340px] gap-4 p-6">
        <div className="space-y-4">
          <CaseHeader />
          <CaseTabs />
          <CaseTimeline />

          <div className="grid grid-cols-2 gap-4">
            <KeyDocuments />
            <TopIntelligenceSources />
          </div>

          <ResearchStatusBar />

          <div className="grid grid-cols-2 gap-4">
            <CoverageMap />
            <AngleSaturationTable />
          </div>

          <EditorialFeedback />

          <UntappedAngles />
        </div>

        <div className="space-y-4">
          <QuickIntelligence />
          <NarrativeGapsFound />
          <AudienceInterestChart />
        </div>
      </div>
    </div>
  );
}