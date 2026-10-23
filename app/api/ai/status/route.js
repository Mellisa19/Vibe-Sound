import { NextResponse } from "next/server";
import { publicAiStatus } from "@/lib/ai/provider";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(publicAiStatus());
}
