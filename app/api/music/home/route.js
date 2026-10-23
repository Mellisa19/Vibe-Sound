import { NextResponse } from "next/server";
import { getHome } from "@/lib/music/catalogue";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getHome();
  return NextResponse.json({ data });
}
