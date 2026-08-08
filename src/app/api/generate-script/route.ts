export { handleGenerateScriptRequest as POST } from "@/lib/generateScriptHandler";

// Hobby plan hard-caps serverless functions at 60s regardless of what's set
// here — this just makes that ceiling explicit instead of implicit.
export const maxDuration = 300;
export const dynamic = "force-dynamic";