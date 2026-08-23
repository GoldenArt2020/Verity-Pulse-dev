import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EditorialDNA } from "@/services/editorialDNA";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("channels")
    .select("editorial_dna, editorial_dna_completed, channel_name, channel_dna")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Channel not found" }, { status: 404 });
  }

  return NextResponse.json({
    editorialDna: data.editorial_dna,
    completed: data.editorial_dna_completed,
    channelName: data.channel_name,
    preferredSubjects: (data.channel_dna as { channelStyle?: { preferredSubjects?: string[] } } | null)
      ?.channelStyle?.preferredSubjects ?? [],
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { editorialDna?: EditorialDNA } | null;

  if (!body?.editorialDna) {
    return NextResponse.json({ error: "editorialDna is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const editorialDna: EditorialDNA = { ...body.editorialDna, completedAt: new Date().toISOString() };

  const { error } = await supabase
    .from("channels")
    .update({ editorial_dna: editorialDna, editorial_dna_completed: true })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ editorialDna });
}