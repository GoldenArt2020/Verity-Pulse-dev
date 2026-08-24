import type { AIProvider, AIGenerateOptions, ProviderHealth } from "./types";
import { groqProvider } from "./groqProvider";
import { agentRouterFastProvider, agentRouterWriteProvider } from "./agentRouterProvider";
import { claudeProvider } from "./claudeProvider";
import { openaiProvider } from "./openaiProvider";

const healthLog: Record<string, ProviderHealth> = {};

function recordHealth(name: string, status: ProviderHealth["status"], message?: string) {
  healthLog[name] = { name, status, lastChecked: new Date().toISOString(), message };
}

function makeRouter(providers: AIProvider[]) {
  async function withFallback<T>(fn: (provider: AIProvider) => Promise<T>): Promise<T> {
    const errors: string[] = [];
    for (const provider of providers) {
      if (!provider.isConfigured()) {
        recordHealth(provider.name, "unconfigured");
        continue;
      }
      try {
        const result = await fn(provider);
        recordHealth(provider.name, "healthy");
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        recordHealth(provider.name, "down", message);
        errors.push(`${provider.name}: ${message}`);
      }
    }
    throw new Error(`All AI providers failed or unconfigured. ${errors.join(" | ")}`);
  }

  return {
    summarizeCase: (rawText: string) => withFallback((p) => p.summarizeCase(rawText)),
    generateNarratives: (caseSummary: string) => withFallback((p) => p.generateNarratives(caseSummary)),
    scoreTitle: (title: string, context?: string) => withFallback((p) => p.scoreTitle(title, context)),
    generateText: (prompt: string, options?: AIGenerateOptions) => withFallback((p) => p.generateText(prompt, options)),
    isConfigured: () => providers.some((p) => p.isConfigured()),
    getHealth: (): ProviderHealth[] => Object.values(healthLog),
  };
}

// "Other calls" — angle generation, recommendations, research. Groq first
// (fast, cheap, reliable), AgentRouter and OpenAI as fallback if Groq is
// down or rate-limited.
export const aiRouter = makeRouter([groqProvider, agentRouterFastProvider, openaiProvider]);

// Script writing prose. Unchanged priority — AgentRouter (Claude Opus)
// first, Claude direct as fallback. scriptWriter.ts's section-writing step
// calls claudeProvider directly anyway, bypassing this router.
export const scriptRouter = makeRouter([agentRouterWriteProvider, claudeProvider]);