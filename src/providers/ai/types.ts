export interface AIGenerateOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface AIProvider {
  name: string;
  isConfigured(): boolean;
  summarizeCase(rawText: string, options?: AIGenerateOptions): Promise<string>;
  generateNarratives(caseSummary: string, options?: AIGenerateOptions): Promise<string[]>;
  scoreTitle(title: string, context?: string, options?: AIGenerateOptions): Promise<{ score: number; reasons: string[] }>;
  generateText(prompt: string, options?: AIGenerateOptions): Promise<string>;
}

export interface ProviderHealth {
  name: string;
  status: "healthy" | "degraded" | "down" | "unconfigured";
  lastChecked: string;
  message?: string;
}