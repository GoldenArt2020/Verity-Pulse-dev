"use client";

import Link from "next/link";
import { ChevronLeft, FileOutput, Sparkles } from "lucide-react";
import { OptimizeHeader } from "@/components/optimize/OptimizeHeader";
import { OptimizeTabs } from "@/components/optimize/OptimizeTabs";
import { TitleAnalyzerList } from "@/components/optimize/TitleAnalyzerList";
import { TitlePerformancePrediction } from "@/components/optimize/TitlePerformancePrediction";
import { KeywordsImpact } from "@/components/optimize/KeywordsImpact";
import { EmotionalImpactRadar } from "@/components/optimize/EmotionalImpactRadar";
import { TargetAudienceMatch } from "@/components/optimize/TargetAudienceMatch";
import { ThumbnailPreviewPanel } from "@/components/optimize/ThumbnailPreviewPanel";
import { OptimizationChecklist } from "@/components/optimize/OptimizationChecklist";
import { OptimizeSummaryBar } from "@/components/optimize/OptimizeSummaryBar";

export default function OptimizePage() {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-800/60 bg-[rgb(4,9,22)] px-8 py-4">
        <div className="flex items-center gap-4">
          <Link href="/angle-builder" className="text-slate-400 hover:text-slate-200">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-display text-lg font-bold text-white">Optimize</h1>
            <p className="text-xs text-slate-500">Optimize every element of your video for maximum performance.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800/50">
            <FileOutput className="h-3.5 w-3.5" /> Export Report
          </button>
          <button className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-3.5 py-2 text-xs font-semibold text-white hover:scale-[1.02] active:scale-[0.98]">
            <Sparkles className="h-3.5 w-3.5" /> Save Optimization
          </button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <OptimizeHeader />
        <OptimizeTabs />

        <div className="grid grid-cols-[1fr_340px] gap-4">
          <div className="space-y-4">
            <TitleAnalyzerList />
            <TitlePerformancePrediction />
            <div className="grid grid-cols-3 gap-4">
              <KeywordsImpact />
              <EmotionalImpactRadar />
              <TargetAudienceMatch />
            </div>
          </div>

          <div className="space-y-4">
            <ThumbnailPreviewPanel />
            <OptimizationChecklist />
          </div>
        </div>

        <OptimizeSummaryBar />
      </div>
    </div>
  );
}