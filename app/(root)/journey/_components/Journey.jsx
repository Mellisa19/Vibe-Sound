"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDownRight, ArrowUpRight, Loader2, Route, Wand2 } from "lucide-react";
import PlayCollectionButton from "@/components/tracks/play-collection-button";
import TrackRow from "@/components/tracks/track-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMusicProvider, useTaste } from "@/hooks/use-context";

const PRESETS = [
  {
    label: "Calm → Euphoric",
    prompt:
      "Start calm and acoustic, then gradually build into euphoric Afrobeats and dance over the next hour.",
  },
  {
    label: "Heartbreak → Healing",
    prompt:
      "Start sad and stripped back, then slowly move into warm soul and hopeful R&B.",
  },
  {
    label: "Focus → Party",
    prompt:
      "Start with quiet lo-fi focus music, then build into high-energy Amapiano and Afrobeats.",
  },
  {
    label: "Peak → Wind down",
    prompt:
      "Start with high-energy Afro house, then descend into mellow soul and ambient music.",
  },
];

function StageBar({ value }) {
  const percent = Math.round((Number(value) || 0) * 100);
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
      <div className="h-full rounded-full bg-foreground/70" style={{ width: `${percent}%` }} />
    </div>
  );
}

export default function Journey() {
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
        const response = await fetch("/api/ai/journey", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ prompt: clean, profile: taste?.profile }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || "The journey could not be built.");
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
    router.replace(`/journey?q=${encodeURIComponent(clean)}`, { scroll: false });
    run(clean);
  };

  const direction = result?.brief?.direction;
  const DirectionIcon = direction === "descend" ? ArrowDownRight : ArrowUpRight;

  return (
    <main className="px-6 py-8 md:px-20 lg:px-32">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center gap-2">
          <Route className="h-4 w-4" />
          <h1 className="text-base font-medium">AI Playlist Journey</h1>
          <Badge variant="outline" className="font-normal">
            Energy arcs · real queue
          </Badge>
        </div>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Ask for a set that moves. VibeSound splits the arc into energy stages,
          searches the live catalogue for each stage, and builds one ordered queue.
        </p>

        <form onSubmit={submit} className="mt-5 rounded-xl border border-border bg-secondary/10 p-4">
          <Textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={3}
            maxLength={1200}
            placeholder="Start calm and acoustic, then gradually build into euphoric Afrobeats and dance."
            className="resize-none border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
            aria-label="Describe the journey arc"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground">{prompt.length}/1200</span>
            <Button type="submit" disabled={loading || !prompt.trim()} className="rounded-full">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              {loading ? "Building the arc..." : "Build my journey"}
            </Button>
          </div>
        </form>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setPrompt(preset.prompt)}
              className="rounded-full border border-border/70 px-2.5 py-1 text-[11px] text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              {preset.label}
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
              Sequencing stages and searching the catalogue...
            </div>
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-[68px] animate-pulse rounded-md bg-secondary/40" />
            ))}
          </div>
        ) : null}

        {result ? (
          <div className="mt-8">
            <div className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-medium">{result.title}</h2>
                    {direction ? (
                      <Badge variant="outline" className="gap-1 font-normal">
                        <DirectionIcon className="h-3 w-3" />
                        {direction}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    {result.summary}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="font-normal">
                      {result.stages?.length || 0} stages
                    </Badge>
                    <Badge variant="outline" className="font-normal">
                      {result.trackCount || 0} tracks
                    </Badge>
                    <Badge variant="outline" className="font-normal">
                      {result.source === "model"
                        ? `AI arc · ${result.aiStatus?.model}`
                        : result.aiStatus?.configured
                          ? "Local arc · AI unavailable"
                          : "Rule-based arc · no AI key"}
                    </Badge>
                  </div>
                </div>
                <PlayCollectionButton tracks={result.tracks} label="Play journey" />
              </div>

              {result.notice ? (
                <p className="mt-3 rounded-md bg-secondary/50 p-2 text-[11px] text-muted-foreground">
                  {result.notice}
                </p>
              ) : null}
            </div>

            <div className="mt-7 border-l border-border pl-5">
              {result.stages?.map((stage, stageIndex) => (
                <section key={`${stage.label}-${stageIndex}`} className="relative pb-8">
                  <span className="absolute -left-[26px] top-1.5 h-3 w-3 rounded-full border-2 border-foreground bg-background" />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium">{stage.label}</h3>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {Math.round((stage.energy || 0) * 100)}% energy
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {stage.genreLabels?.join(" · ")}
                    </span>
                  </div>
                  <StageBar value={stage.energy} />

                  <div className="mt-3 grid gap-2">
                    {stage.tracks?.map((track) => {
                      const flatIndex = result.tracks.findIndex((item) => item.id === track.id);
                      return (
                        <TrackRow
                          key={track.id}
                          track={track}
                          index={flatIndex}
                          reason={track.reason}
                          onPlay={(selected, selectedIndex) => {
                            if (taste?.record) taste.record("play", selected);
                            localStorage.setItem("last-played", selected.id);
                            music?.startQueue?.(result.tracks, selectedIndex);
                          }}
                        />
                      );
                    })}
                    {!stage.tracks?.length ? (
                      <p className="text-xs text-muted-foreground">
                        No playable tracks matched this stage.
                      </p>
                    ) : null}
                  </div>
                </section>
              ))}
            </div>

            <div className="rounded-md border border-dashed p-4 text-[11px] leading-relaxed text-muted-foreground">
              <strong className="font-medium text-foreground">How this works.</strong>{" "}
              {result.meta?.method} The stage structure is either inferred by the
              configured model or produced by the built-in arc planner. Playback uses
              Apple Music 30-second previews.
            </div>
          </div>
        ) : null}

        {!result && !loading ? (
          <div className="mt-8 rounded-md border border-dashed p-4 text-[11px] leading-relaxed text-muted-foreground">
            <strong className="font-medium text-foreground">Tip.</strong> Name both ends
            of the arc (“calm to euphoric”), a genre (“Afrobeats”), or an occasion
            (“focus to party”). Add <code className="rounded bg-secondary px-1 py-0.5">AI_API_KEY</code>{" "}
            to <code className="rounded bg-secondary px-1 py-0.5">.env.local</code> to let a
            model design the stage labels; without it, the built-in arc planner runs.
          </div>
        ) : null}
      </div>
    </main>
  );
}
