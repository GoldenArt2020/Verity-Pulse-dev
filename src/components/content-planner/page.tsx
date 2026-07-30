"use client";

import { CaseHeaderCard } from "@/components/content-planner/CaseHeaderCard";
import { OpportunityStatPanels } from "@/components/content-planner/OpportunityStatPanels";
import { WorkflowTabs } from "@/components/content-planner/WorkflowTabs";
import { WorkflowStepper } from "@/components/content-planner/WorkflowStepper";
import { WorkflowStageColumn } from "@/components/content-planner/WorkflowStageColumn";
import { PublishingScheduleCard } from "@/components/content-planner/PublishingScheduleCard";
import { PrePublishChecklist } from "@/components/content-planner/PrePublishChecklist";
import { VideoDetailsCard } from "@/components/content-planner/VideoDetailsCard";
import { ProgressSummaryBar } from "@/components/content-planner/ProgressSummaryBar";
import { WORKFLOW_STAGES } from "@/constants/contentPlannerWorkflow";
import { Plus, MoreVertical, ChevronDown } from "lucide-react";

export default function ContentPlannerPage() {
  return (
    <div className="p-6">
      {/* Case summary card */}
      <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
        <div className="flex items-start justify-between gap-6">
          <CaseHeaderCard />
          <OpportunityStatPanels />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_340px] gap-4">
        <div className="space-y-4">
          <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40">
            <WorkflowTabs />

            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[15px] font-semibold text-white">Production Workflow</h2>
                  <p className="text-[11px] text-slate-500">
                    Track every stage of your video production
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-[12px] font-medium text-slate-300 hover:bg-slate-800/50">
                    View as: Timeline <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <button className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-3 py-2 text-[12px] font-semibold text-white hover:bg-blue-600">
                    <Plus className="h-3.5 w-3.5" /> Add Task
                  </button>
                  <button className="rounded-xl border border-slate-700 p-2 text-slate-400 hover:bg-slate-800/50">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <WorkflowStepper />
              </div>

              <div className="mt-4 flex gap-3 overflow-x-auto">
                {WORKFLOW_STAGES.map((stage) => (
                  <WorkflowStageColumn key={stage.id} stage={stage} />
                ))}
              </div>
            </div>
          </div>

          <ProgressSummaryBar />
        </div>

        <div className="space-y-4">
          <PublishingScheduleCard />
          <PrePublishChecklist />
          <VideoDetailsCard />
        </div>
      </div>
    </div>
  );
}