import { NextResponse } from "next/server";
import { searchSongs } from "@/lib/music/catalogue";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || searchParams.get("q") || "";
  const country = searchParams.get("country") || undefined;
  const limit = Number(searchParams.get("limit") || 24);

  const results = await searchSongs(query, { limit, country });
  return NextResponse.json({ data: { results } });
}
