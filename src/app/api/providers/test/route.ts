import { NextResponse } from "next/server";
import { youtubeProvider } from "@/providers/youtube";

export async function GET() {
  const results: Record<string, unknown> = {};

  try {
    const yt = await youtubeProvider.getChannelStats("UC_x5XG1OV2P6uZZ5FSM9Ttw");
    results.youtube = { ok: true, title: yt.title };
  } catch (err) {
    results.youtube = { ok: false, error: err instanceof Error ? err.message : "failed" };
  }

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: "Say 'ok' and nothing else." }],
        max_tokens: 5,
      }),
    });
    const data = await res.json();
    results.groq = res.ok ? { ok: true, reply: data.choices?.[0]?.message?.content } : { ok: false, error: data };
  } catch (err) {
    results.groq = { ok: false, error: err instanceof Error ? err.message : "failed" };
  }

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: process.env.TAVILY_API_KEY, query: "test", max_results: 1 }),
    });
    const data = await res.json();
    results.tavily = res.ok ? { ok: true, resultCount: data.results?.length } : { ok: false, error: data };
  } catch (err) {
    results.tavily = { ok: false, error: err instanceof Error ? err.message : "failed" };
  }

  return NextResponse.json(results);
}