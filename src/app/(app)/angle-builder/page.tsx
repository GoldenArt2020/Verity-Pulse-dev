"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { AngleBuilderHeader } from "@/components/angle-builder/AngleBuilderHeader";
import { StepTabs } from "@/components/angle-builder/StepTabs";
import { GeneratedAnglesList } from "@/components/angle-builder/GeneratedAnglesList";
import { SelectedAnglePanel } from "@/components/angle-builder/SelectedAnglePanel";
import { AudienceProfileMatch } from "@/components/angle-builder/AudienceProfileMatch";
import { AngleScoreBreakdown } from "@/components/angle-builder/AngleScoreBreakdown";
import { TitleIdeasList } from "@/components/angle-builder/TitleIdeasList";
import { AngleBuilderStatsBar } from "@/components/angle-builder/AngleBuilderStatsBar";

export default function AngleBuilderPage() {
  return (
    <div>
      <div className="flex items-center gap-4 border-b border-slate-800/60 bg-[rgb(4,9,22)] px-8 py-4">
        <Link href="/case-analyzer" className="text-slate-400 hover:text-slate-200">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-display text-lg font-bold text-white">Angle Builder</h1>
          <p className="text-xs text-slate-500">Create compelling narrative angles that your audience will click, watch, and remember.</p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <AngleBuilderHeader />
        <StepTabs />

        <div className="grid grid-cols-[1fr_1fr_340px] gap-4">
          <GeneratedAnglesList />
          <SelectedAnglePanel />
          <div className="space-y-4">
            <AudienceProfileMatch />
            <AngleScoreBreakdown />
            <TitleIdeasList />
          </div>
        </div>

        <AngleBuilderStatsBar />
      </div>
    </div>
  );
}