import { NextResponse } from "next/server";
import { youtubeProvider } from "@/providers/youtube";

export async function GET() {
  const providers = [
    {
      name: "Groq",
      category: "AI Provider",
      status: process.env.GROQ_API_KEY ? "connected" : "disconnected",
      detail: process.env.GROQ_API_KEY
        ? "Handling narrative + SEO generation."
        : "Not yet connected — add GROQ_API_KEY.",
    },
    {
      name: "Tavily",
      category: "Search Provider",
      status: process.env.TAVILY_API_KEY ? "connected" : "disconnected",
      detail: process.env.TAVILY_API_KEY
        ? "Primary research and evidence retrieval."
        : "Not yet connected — add TAVILY_API_KEY.",
    },
    {
      name: "YouTube Data API",
      category: "Video Provider",
      status: youtubeProvider.isConfigured() ? "connected" : "disconnected",
      detail: youtubeProvider.isConfigured()
        ? "Channel stats and video search."
        : "Not yet connected — add YOUTUBE_API_KEY.",
    },
    {
      name: "GNews",
      category: "News Provider",
      status: process.env.GNEWS_API_KEY ? "connected" : "disconnected",
      detail: process.env.GNEWS_API_KEY
        ? "Backup news retrieval."
        : "Not yet connected — add GNEWS_API_KEY.",
    },
  ];

  return NextResponse.json({ providers });
}