export { handleGenerateScriptRequest as POST } from "@/lib/generateScriptHandler";

// Multi-stage script generation (research + outline + multiple section calls + SEO)
// runs well past Vercel's default timeout. Extend it explicitly.
export const maxDuration = 300;
export const dynamic = "force-dynamic";