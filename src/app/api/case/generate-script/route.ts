export { handleGenerateScriptRequest as POST } from "@/lib/generateScriptHandler";

// Hobby plan hard-caps serverless functions at 60s regardless of what's set
// here. If you're on Vercel Pro, this lets longer scripts actually finish
// instead of getting killed mid-generation.
export const maxDuration = 300;
export const dynamic = "force-dynamic";