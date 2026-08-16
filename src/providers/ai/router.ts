import type { AIProvider, ProviderHealth } from "./types";
import { gorouterFastProvider } from "./gorouterProvider";

const providers: AIProvider[] = [gorouterFastProvider];
const healthLog: Record<string, ProviderHealth> = {};

function recordHealth(name: string, status: ProviderHealth["status"], message?: string) {
  healthLog[name] = { name, status, lastChecked: new Date().toISOString(), message };
}

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

export const aiRouter = {
  summarizeCase: (rawText: string) => withFallback((p) => p.summarizeCase(rawText)),
  generateNarratives: (caseSummary: string) => withFallback((p) => p.generateNarratives(caseSummary)),
  scoreTitle: (title: string, context?: string) => withFallback((p) => p.scoreTitle(title, context)),
  generateText: (prompt: string) => withFallback((p) => p.generateText(prompt)),
  getHealth: (): ProviderHealth[] => Object.values(healthLog),
};