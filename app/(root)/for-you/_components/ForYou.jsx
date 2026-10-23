"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Loader2, RefreshCw, Sparkles, Bookmark, SlidersHorizontal } from "lucide-react";
import PlayCollectionButton from "@/components/tracks/play-collection-button";
import TrackRow from "@/components/tracks/track-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMusicProvider, useTaste } from "@/hooks/use-context";
import { getForYouFeed } from "@/lib/fetch";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "mix", label: "Your mix", icon: Sparkles },
  { id: "liked", label: "Liked", icon: Heart },
  { id: "saved", label: "Saved", icon: Bookmark },
];

export default function ForYou() {
  const taste = useTaste();
  const music = useMusicProvider();
  const [tab, setTab] = useState("mix");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const updatedAt = taste?.profile?.updatedAt;
  const ready = taste?.ready;

  useEffect(() => {
    if (!ready) return;
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getForYouFeed(taste.profile);
        if (active) setData(result);
      } catch {
        if (active) setError("The catalogue is unavailable right now.");
      } finally {
        if (active) setLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [ready, updatedAt]);

  const liked = taste?.likedTracks || [];
  const saved = taste?.savedTracks || [];
  const summary = taste?.summary;

  const visible =
    tab === "liked" ? liked : tab === "saved" ? saved : data?.tracks || [];

  const playFrom = (track, index) => {
    if (taste?.record) taste.record("play", track);
    localStorage.setItem("last-played", track.id);
    music?.startQueue?.(visible, index);
  };

  const reset = () => {
    if (typeof window === "undefined") return;
    if (!window.confirm("Reset all likes, saves and listening signals on this device?")) {
      return;
    }
    taste?.reset();
    setData(null);
    setTab("mix");
  };

  return (
    <main className="px-6 py-8 md:px-20 lg:px-32">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          <h1 className="text-base font-medium">For You</h1>
          <Badge variant="outline" className="font-normal">
            On-device personalisation
          </Badge>
        </div>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Your mix is ranked from the feedback on this device: likes and saves count
          most, replays and plays lift an artist, skips pull them back. Nothing is
          stored on a server.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="font-normal">
                {summary?.events || 0} signals
              </Badge>
              <Badge variant="outline" className="font-normal">
                {summary?.likedCount || 0} liked
              </Badge>
              <Badge variant="outline" className="font-normal">
                {summary?.savedCount || 0} saved
              </Badge>
            </div>
            <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
              <div>
                <span className="text-foreground">Top artists</span>
                <p className="mt-0.5">
                  {summary?.artists?.length
                    ? summary.artists.map((artist) => artist.name).join(", ")
                    : "No artist affinity yet"}
                </p>
              </div>
              <div>
                <span className="text-foreground">Top genres</span>
                <p className="mt-0.5">
                  {summary?.genres?.length
                    ? summary.genres.map((genre) => genre.name).join(", ")
                    : "No genre affinity yet"}
                </p>
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={reset}
            disabled={!summary?.events}
            className="rounded-full"
          >
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Reset profile
          </Button>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 rounded-full border border-border p-1">
            {TABS.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition",
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                  <span className="text-[10px] opacity-60">
                    {item.id === "liked" ? liked.length : item.id === "saved" ? saved.length : ""}
                  </span>
                </button>
              );
            })}
          </div>

          {tab === "mix" ? (
            <PlayCollectionButton tracks={visible} label="Play my mix" />
          ) : null}
        </div>

        {error ? (
          <div className="mt-5 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            {error}
          </div>
        ) : null}

        {tab === "mix" && loading ? (
          <div className="mt-5 grid gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Ranking the catalogue around your signals...
            </div>
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-[68px] animate-pulse rounded-md bg-secondary/40" />
            ))}
          </div>
        ) : null}

        {!loading || tab !== "mix" ? (
          <div className="mt-5 grid gap-2">
            {visible.map((track, index) => (
              <TrackRow
                key={track.id}
                track={track}
                index={index}
                reason={
                  tab === "liked"
                    ? "Liked on this device"
                    : tab === "saved"
                      ? "Saved on this device"
                      : track.reason
                }
                onPlay={playFrom}
              />
            ))}
            {!visible.length ? (
              <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                {tab === "liked"
                  ? "No liked tracks yet. Tap the heart on a recommendation."
                  : tab === "saved"
                    ? "Nothing saved yet. Tap the bookmark on a track."
                    : "No mix available yet. Try the AI Companion, or refresh in a moment."}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-8 flex flex-col justify-between gap-3 rounded-xl border border-border bg-secondary/10 p-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-sm font-medium">
              {data?.personalised ? "This mix is learning" : "Build your signal"}
            </h2>
            <p className="mt-0.5 max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
              {data?.summary ||
                "Like, save, replay or skip tracks and this page will re-rank around those signals."}
            </p>
          </div>
          <Button asChild variant="outline" className="flex-none rounded-full">
            <Link href="/companion">Ask the AI Companion</Link>
          </Button>
        </div>

        <div className="mt-5 rounded-md border border-dashed p-4 text-[11px] leading-relaxed text-muted-foreground">
          <strong className="font-medium text-foreground">Privacy & limits.</strong> The
          profile lives in your browser&apos;s localStorage under{" "}
          <code className="rounded bg-secondary px-1 py-0.5">vibesound:taste:v1</code>. It
          is sent with a recommendation request only to rank catalogue results and is
          never written to a database. Ranking is metadata-based (genre, artist,
          recency); Apple previews do not expose audio-feature embeddings.
        </div>
      </div>
    </main>
  );
}
