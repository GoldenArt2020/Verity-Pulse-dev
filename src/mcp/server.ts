import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as tools from "./tools";

function textResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

/** Built fresh per-request (see /api/mcp/route.ts) — this is a stateless
 * server, appropriate for a serverless platform where nothing should be
 * assumed to persist in memory between invocations. `userId` scopes the
 * one tool (get_production_bible) that's genuinely per-user; every other
 * tool reads shared case-intel data any authenticated caller can see. */
export function buildMcpServer(userId: string): McpServer {
  const server = new McpServer({ name: "verity-pulse", version: "1.0.0" });

  server.tool(
    "get_case",
    "Find a case by name. Returns matching cases with id, summary, category, and scores.",
    { caseName: z.string().describe("Case name or partial name to search for") },
    async ({ caseName }) => textResult(await tools.getCase(caseName))
  );

  server.tool(
    "get_case_sources",
    "List discovered video sources for a case, with relevance score and transcript availability — metadata only, no transcript text. Use get_source_transcript for the actual text of a specific source.",
    { caseId: z.string().describe("Case id, from get_case") },
    async ({ caseId }) => textResult(await tools.getCaseSources(caseId))
  );

  server.tool(
    "get_source_transcript",
    "Get the cleaned transcript text for one specific video source. Only call this for sources you actually need the full text of — get_research_summary and get_case_evidence give you extracted facts/claims/quotes without needing every full transcript.",
    { sourceId: z.string().describe("Video source id, from get_case_sources") },
    async ({ sourceId }) => textResult(await tools.getSourceTranscript(sourceId))
  );

  server.tool(
    "get_case_timeline",
    "Get a chronological list of dated events extracted across all video sources for a case.",
    { caseId: z.string() },
    async ({ caseId }) => textResult(await tools.getCaseTimeline(caseId))
  );

  server.tool(
    "get_case_evidence",
    "Get the case facts dossier (people, charges, locations, unresolved questions) plus notable quotations extracted from video sources.",
    { caseId: z.string() },
    async ({ caseId }) => textResult(await tools.getCaseEvidence(caseId))
  );

  server.tool(
    "get_research_summary",
    "Get the structured research summary for a case: source count, people identified, events, leads, and claim-verification counts (confirmed/conflicting/unverified/single-source). Call this FIRST before pulling individual transcripts.",
    { caseId: z.string() },
    async ({ caseId }) => textResult(await tools.getResearchSummaryTool(caseId))
  );

  server.tool(
    "get_conflicting_claims",
    "Get claims where different video sources stated materially different values for the same fact (e.g. different times for the same event) — never treat these as settled without noting the conflict.",
    { caseId: z.string() },
    async ({ caseId }) => textResult(await tools.getConflictingClaims(caseId))
  );

  server.tool(
    "get_production_bible",
    "Get the calling creator's Channel DNA / production bible (storytelling style, pacing, tone, typical hooks) — use this to write scripts in the channel's established voice.",
    {},
    async () => textResult(await tools.getProductionBible(userId))
  );

  return server;
}