import { NextResponse } from "next/server";
import { getForYouMix } from "@/lib/ai/companion";
import { sanitizeProfile } from "@/lib/personalization";
import { rateLimit } from "@/lib/api/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const limited = rateLimit(request, { limit: 40, windowMs: 60_000 });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a moment." },
      { status: 429 },
    );
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const profile = sanitizeProfile(body?.profile);
  const result = await getForYouMix(profile);
  return NextResponse.json(result);
}
