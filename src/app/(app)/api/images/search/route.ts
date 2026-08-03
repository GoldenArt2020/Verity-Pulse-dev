import { NextRequest, NextResponse } from "next/server";
import { fetchAtmosphericImage, buildImageQuery } from "@/providers/images/imageProvider";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const imageQuery = searchParams.get("imageQuery");
  const category = searchParams.get("category");
  const location = searchParams.get("location");

  const query = buildImageQuery(imageQuery, category, location);
  const result = await fetchAtmosphericImage(query);

  if (!result) {
    return NextResponse.json({ url: null });
  }

  return NextResponse.json({ url: result.url, source: result.source });
}