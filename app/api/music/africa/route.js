import { NextResponse } from "next/server";
import { getAfricanDiscovery } from "@/lib/music/catalogue";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const scene = searchParams.get("scene") || undefined;
  const data = await getAfricanDiscovery({ scene });
  return NextResponse.json({ data });
}
