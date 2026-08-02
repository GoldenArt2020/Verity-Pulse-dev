import { useMemo } from "react";

interface BriefContext {
  userName: string;
  hasUnfinishedWork: boolean;
  unfinishedCaseName?: string;
  unfinishedProgress?: number;
  newOpportunityScore?: number;
  searchGrowthPercent?: number;
}

interface DailyBrief {
  greeting: string;
  subline: string;
}

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function useDailyBrief(ctx: BriefContext): DailyBrief {
  return useMemo(() => {
    const timeGreeting = getTimeGreeting();

    if (ctx.newOpportunityScore && ctx.newOpportunityScore >= 90) {
      return {
        greeting: `${timeGreeting}, ${ctx.userName}.`,
        subline: "I found one opportunity that stands above everything else today.",
      };
    }

    if (ctx.hasUnfinishedWork && ctx.unfinishedCaseName) {
      return {
        greeting: "Welcome back.",
        subline: `${ctx.unfinishedCaseName} is ready whenever you are.`,
      };
    }

    return {
      greeting: `${timeGreeting}, ${ctx.userName}.`,
      subline: "Ready to create something exceptional today?",
    };
  }, [ctx]);
}