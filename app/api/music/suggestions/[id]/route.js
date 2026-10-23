import { NextResponse } from "next/server";
import { getSuggestions } from "@/lib/music/catalogue";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const tracks = await getSuggestions(params.id, 8);
  return NextResponse.json({ data: tracks });
}
