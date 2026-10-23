import { NextResponse } from "next/server";
import { getSongById } from "@/lib/music/catalogue";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const track = await getSongById(params.id);
  return NextResponse.json({ data: track ? [track] : [] });
}
