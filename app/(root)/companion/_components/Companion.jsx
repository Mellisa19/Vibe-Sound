"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import PlayCollectionButton from "@/components/tracks/play-collection-button";
import TrackRow from "@/components/tracks/track-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTaste, useMusicProvider } from "@/hooks/use-context";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  "I'm getting ready to go out. Give me confident, energetic Afrobeats that will put me in the right mood.",
  "Something calm and acoustic for a rainy Sunday morning.",
  "High-energy Amapiano for the gym, nothing too slow.",
  "I want the feeling of a late-night drive through Lagos.",
  "Music like Tems but more upbeat.",
];

function SourceBadge({ status }) {
  if (!status) return null;
  const isModel = status.mode === "model";
  const label = isModel
    ? `AI model · ${status.model}`
    : status.configured
      ? "Local fallback · AI unavailable"
      : "Local interpreter · no AI key";

  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
      <Badge
        variant="outline"
        className={cn("font-normal", isModel && "bg-secondary text-foreground")}
      >
        {label}
      </Badge>
      <span>{status.provider}</span>
    </div>
  );
}

function EnergyMeter({ value }) {
  const percent = Math.round((Number(value) || 0) * 100);
  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Energy</span>
        <span>{percent}%</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-foreground/70" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default function Companion() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taste = useTaste();
  const music = useMusicProvider();
  const initial = searchParams.get("q") || "";

  const [prompt, setPrompt] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const requestId = useRef(0);
  const autoRan = useRef(false);

  const run = useCallback(
    async (text) => {
      const clean = String(text || "").trim();
      if (!clean || loading) return;

      const id = requestId.current + 1;
      requestId.current = id;
      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const response = await fetch("/api/ai/companion", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ prompt: clean, profile: taste?.profile }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || "The companion could not complete that request.");
        }
        if (requestId.current === id) setResult(data);
      } catch (err) {
        if (requestId.current === id) {
          setError(err?.message || "Something went wrong. Please try again.");
        }
      } finally {
        if (requestId.current === id) setLoading(false);
      }
    },
    [loading, taste?.profile],
  );

  useEffect(() => {
    if (initial && !autoRan.current) {
      autoRan.current = true;
      run(initial);
    }
  }, [initial, run]);

  const submit = (event) => {
    event.preventDefault();
    const clean = prompt.trim();
    if (!clean) return;
    router.replace(`/companion?q=${encodeURIComponent(clean)}`, { scroll: false });
    run(clean);
  };

  return (
    <main className="px-6 py-8 md:px-20 lg:px-32">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <h1 className="text-base font-medium">AI Music Companion</h1>
          <Badge variant="outline" className="font-normal">
            Mood · activity · genre · energy
          </Badge>
        </div>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Tell VibeSound what you want in ordinary language. It interprets the brief,
          searches real catalogue metadata and ranks a playable mix — no invented songs.
        </p>

        <form onSubmit={submit} className="mt-5 rounded-xl border border-border bg-secondary/10 p-4">
          <Textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={3}
            maxLength={1200}
            placeholder="I'm getting ready to go out. Give me confident, energetic Afrobeats that will put me in the right mood."
            className="resize-none border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
            aria-label="Describe what you want to hear"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground">{prompt.length}/1200</span>
            <Button type="submit" disabled={loading || !prompt.trim()} className="rounded-full">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              {loading ? "Reading the vibe..." : "Build my mix"}
            </Button>
          </div>
        </form>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setPrompt(example)}
              className="rounded-full border border-border/70 px-2.5 py-1 text-left text-[11px] text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              {example.length > 62 ? `${example.slice(0, 62)}…` : example}
            </button>
          ))}
        </div>

        {error ? (
          <div className="mt-6 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-8 grid gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Interpreting the brief and searching the catalogue...
            </div>
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-[68px] animate-pulse rounded-md bg-secondary/40" />
            ))}
          </div>
        ) : null}

        {result ? (
          <div className="mt-8">
            <div className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-medium">How I read that</h2>
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    {result.intent?.summary}
                  </p>
                </div>
                <PlayCollectionButton tracks={result.tracks} label="Play this mix" />
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {result.intent?.genreLabels?.map((genre) => (
                  <Badge key={genre} variant="secondary" className="font-normal">
                    {genre}
                  </Badge>
                ))}
                {result.intent?.moodLabels?.map((mood) => (
                  <Badge key={mood} variant="outline" className="font-normal">
                    {mood}
                  </Badge>
                ))}
                {result.intent?.activityLabel ? (
                  <Badge variant="outline" className="font-normal">
                    {result.intent.activityLabel}
                  </Badge>
                ) : null}
                {result.intent?.seedArtist ? (
                  <Badge variant="outline" className="font-normal">
                    Like {result.intent.seedArtist}
                  </Badge>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <EnergyMeter value={result.intent?.energy} />
                <SourceBadge status={result.aiStatus} />
              </div>

              {result.notice ? (
                <p className="mt-3 rounded-md bg-secondary/50 p-2 text-[11px] text-muted-foreground">
                  {result.notice}
                </p>
              ) : null}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-medium">Your mix</h2>
                <p className="text-[11px] text-muted-foreground">
                  {result.tracks?.length || 0} playable tracks · Apple Music 30-second previews
                </p>
              </div>
            </div>

            <div className="mt-3 grid gap-2">
              {result.tracks?.map((track, index) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={index}
                  reason={track.reason}
                  badge={index === 0 ? "opener" : undefined}
                  onPlay={(selected, selectedIndex) => {
                    if (taste?.record) taste.record("play", selected);
                    localStorage.setItem("last-played", selected.id);
                    music?.startQueue?.(result.tracks, selectedIndex);
                  }}
                />
              ))}
            </div>

            {!result.tracks?.length ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No playable tracks matched. Try a broader genre or mood.
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-10 rounded-md border border-dashed p-4 text-[11px] leading-relaxed text-muted-foreground">
          <strong className="font-medium text-foreground">How this works.</strong> A
          configured language model interprets your request into structured intent. Without
          a key, VibeSound uses its transparent mood/activity interpreter. In both cases,
          tracks come from Apple&apos;s live catalogue and are ranked by genre, energy,
          keywords and the feedback stored on this device. Add{" "}
          <code className="rounded bg-secondary px-1 py-0.5">AI_API_KEY</code> and optionally{" "}
          <code className="rounded bg-secondary px-1 py-0.5">AI_BASE_URL</code> /{" "}
          <code className="rounded bg-secondary px-1 py-0.5">AI_MODEL</code> to{" "}
          <code className="rounded bg-secondary px-1 py-0.5">.env.local</code> to enable the
          model path.
        </div>
      </div>
    </main>
  );
}
