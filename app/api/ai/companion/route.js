import { NextResponse } from "next/server";
import { buildCompanionMix } from "@/lib/ai/companion";
import { sanitizeProfile } from "@/lib/personalization";
import { rateLimit } from "@/lib/api/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const limited = rateLimit(request, { limit: 20, windowMs: 60_000 });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a moment." },
      { status: 429, headers: { "retry-after": String(limited.retryAfter) } },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt = String(body?.prompt || "").trim();
  if (!prompt) {
    return NextResponse.json(
      { error: "Describe the mood, moment or sound you want." },
      { status: 400 },
    );
  }
  if (prompt.length > 1200) {
    return NextResponse.json(
      { error: "Keep the request under 1,200 characters." },
      { status: 400 },
    );
  }

  const profile = sanitizeProfile(body?.profile);
  const result = await buildCompanionMix(prompt, { profile });

  if (!result.tracks.length) {
    return NextResponse.json(
      {
        ...result,
        notice:
          "The music catalogue did not return playable tracks for that request. Try a broader mood, genre or artist.",
      },
      { status: 200 },
    );
  }

  return NextResponse.json(result);
}
