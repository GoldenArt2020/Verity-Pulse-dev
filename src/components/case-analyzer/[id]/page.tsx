"use client";

import { useParams } from "next/navigation";
import { ScanSearch } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { AnalyzerHeader } from "@/components/case-analyzer/AnalyzerHeader";
import { AnalyzerTabs } from "@/components/case-analyzer/AnalyzerTabs";
import { ScoreBreakdownCard } from "@/components/case-analyzer/ScoreBreakdownCard";
import { NarrativeGapsDetected } from "@/components/case-analyzer/NarrativeGapsDetected";
import { AnalysisProgressBar } from "@/components/case-analyzer/AnalysisProgressBar";
import { KeyIntelligenceSummary } from "@/components/case-analyzer/KeyIntelligenceSummary";
import { TopCompetitorsTable } from "@/components/case-analyzer/TopCompetitorsTable";

export default function CaseAnalyzerPage() {
  const params = useParams<{ id: string }>();

  return (
    <div>
      <TopBar
        title="Case Analyzer"
        subtitle="Deep intelligence analysis to uncover opportunities, gaps and winning angles."
        icon={<ScanSearch className="h-4.5 w-4.5" />}
      />

      <div className="grid grid-cols-[1fr_340px] gap-4 p-6">
        <div className="space-y-4">
          <AnalyzerHeader caseId={params.id} />
          <AnalyzerTabs />
          <ScoreBreakdownCard />
          <NarrativeGapsDetected />
          <AnalysisProgressBar />
        </div>

        <div className="space-y-4">
          <KeyIntelligenceSummary />
          <TopCompetitorsTable />
        </div>
      </div>
    </div>
  );
}