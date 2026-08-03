"use client";

import { useParams } from "next/navigation";
import { CaseIntelligenceView } from "@/components/case-intelligence/CaseIntelligenceView";

export default function CaseIntelligencePage() {
  const params = useParams();
  const caseId = params?.id as string;

  return (
    <CaseIntelligenceView caseId={caseId} backHref="/discover" backLabel="Back to opportunities" />
  );
}