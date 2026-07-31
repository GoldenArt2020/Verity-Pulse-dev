import { NextResponse } from "next/server";

export async function GET() {
  const relevantKeys = Object.keys(process.env).filter((k) =>
    /YOUTUBE|GROQ|TAVILY|GOOGLE/i.test(k)
  );

  return NextResponse.json({
    matchingKeys: relevantKeys,
    hasYoutubeExact: "YOUTUBE_API_KEY" in process.env,
    youtubeValueLength: process.env.YOUTUBE_API_KEY?.length ?? 0,
    groqValueLength: process.env.GROQ_API_KEY?.length ?? 0,
    tavilyValueLength: process.env.TAVILY_API_KEY?.length ?? 0,
  });
}