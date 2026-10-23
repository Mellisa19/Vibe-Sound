import { NextResponse } from "next/server";
import { searchAlbums } from "@/lib/music/catalogue";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || searchParams.get("q") || "";
  const country = searchParams.get("country") || undefined;
  const limit = Number(searchParams.get("limit") || 20);

  const results = await searchAlbums(query, { limit, country });
  return NextResponse.json({ data: { results } });
}
