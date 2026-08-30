import { NextResponse } from "next/server";
import { hasAnyKey } from "@/lib/keyRotation";

function keyCount(prefix: "GROQ" | "TAVILY" | "YOUTUBE"): number {
  let count = 0;
  let i = 1;
  while (process.env[`${prefix}_API_KEY_${i}`]) {
    count++;
    i++;
  }
  return count;
}

export async function GET() {
  // Diagnostic only. Publishing env var names and key counts to anonymous
  // callers is free reconnaissance, so this is local-only.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const relevantKeys = Object.keys(process.env).filter((k) =>
    /YOUTUBE|GROQ|TAVILY|GOOGLE/i.test(k)
  );

  return NextResponse.json({
    matchingKeys: relevantKeys,
    youtube: {
      configured: hasAnyKey("YOUTUBE"),
      numberedKeyCount: keyCount("YOUTUBE"),
      hasLegacySingleKey: "YOUTUBE_API_KEY" in process.env,
    },
    groq: {
      configured: hasAnyKey("GROQ"),
      numberedKeyCount: keyCount("GROQ"),
      hasLegacySingleKey: "GROQ_API_KEY" in process.env,
    },
    tavily: {
      configured: hasAnyKey("TAVILY"),
      numberedKeyCount: keyCount("TAVILY"),
      hasLegacySingleKey: "TAVILY_API_KEY" in process.env,
    },
  });
}