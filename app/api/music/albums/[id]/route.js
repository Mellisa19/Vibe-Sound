import { NextResponse } from "next/server";
import { getAlbumById } from "@/lib/music/catalogue";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const album = await getAlbumById(params.id);
  return NextResponse.json({ data: album });
}
