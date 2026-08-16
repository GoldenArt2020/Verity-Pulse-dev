import { NextRequest, NextResponse } from "next/server";
import { createApiToken } from "@/lib/apiTokens";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const label = (body?.label as string | undefined) ?? "MCP connector";

  try {
    const { token } = await createApiToken(label);
    // Shown once — the raw value is never retrievable again after this response.
    return NextResponse.json({ token });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to create token" }, { status: 500 });
  }
}