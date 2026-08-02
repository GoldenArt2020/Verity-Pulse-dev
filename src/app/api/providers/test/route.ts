import { NextResponse } from "next/server";
import { youtubeProvider } from "@/providers/youtube/youtubeProvider";
import { withRotatingKey } from "@/lib/keyRotation";

export async function GET() {
  const results: Record<string, unknown> = {};

  try {
    const yt = await youtubeProvider.getChannelStats("UC_x5XG1OV2P6uZZ5FSM9Ttw");
    results.youtube = { ok: true, title: yt.title };
  } catch (err) {
    results.youtube = { ok: false, error: err instanceof Error ? err.message : "failed" };
  }

  try {
    const data = await withRotatingKey("GROQ", async (apiKey) => {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: "Say 'ok' and nothing else." }],
          max_tokens: 5,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const error = new Error("Groq test call failed") as Error & { status?: number };
        error.status = res.status;
        throw error;
      }
      return json;
    });
    results.groq = { ok: true, reply: data.choices?.[0]?.message?.content };
  } catch (err) {
    results.groq = { ok: false, error: err instanceof Error ? err.message : "failed" };
  }

  try {
    const data = await withRotatingKey("TAVILY", async (apiKey) => {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey, query: "test", max_results: 1 }),
      });
      const json = await res.json();
      if (!res.ok) {
        const error = new Error("Tavily test call failed") as Error & { status?: number };
        error.status = res.status;
        throw error;
      }
      return json;
    });
    results.tavily = { ok: true, resultCount: data.results?.length };
  } catch (err) {
    results.tavily = { ok: false, error: err instanceof Error ? err.message : "failed" };
  }

  return NextResponse.json(results);
}