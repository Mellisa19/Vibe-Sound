"use client";

import Link from "next/link";
import { ExternalLink, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import FeedbackButtons from "@/components/taste/feedback-buttons";
import { useMusicProvider, useTaste } from "@/hooks/use-context";
import { cn } from "@/lib/utils";

function artwork(track) {
  return (
    track?.image?.[1]?.url ||
    track?.image?.[0]?.url ||
    track?.image?.[2]?.url ||
    null
  );
}

/**
 * Rich recommendation row used by the AI Companion, Journey and For You pages.
 * Playback goes through the shared queue so "next" and "previous" work.
 */
export default function TrackRow({
  track,
  reason,
  badge,
  index,
  onPlay,
  className,
}) {
  const music = useMusicProvider();
  const taste = useTaste();
  if (!track?.id) return null;

  const play = () => {
    if (onPlay) {
      onPlay(track, index);
      return;
    }
    if (taste?.record) taste.record("play", track);
    localStorage.setItem("last-played", track.id);
    if (music?.startQueue) {
      music.startQueue([track], 0);
    } else {
      music?.setMusic?.(track.id);
    }
  };

  return (
    <div
      className={cn(
        "group flex min-w-0 items-center gap-3 overflow-hidden rounded-md border border-border/70 bg-secondary/10 p-2.5 transition hover:bg-secondary/30",
        className,
      )}
    >
      <button
        type="button"
        onClick={play}
        className="relative flex-none overflow-hidden rounded-md"
        aria-label={`Play ${track.name}`}
        title={`Play ${track.name}`}
      >
        {artwork(track) ? (
          <img
            src={artwork(track)}
            alt=""
            className="h-12 w-12 rounded-md bg-secondary object-cover"
          />
        ) : (
          <div className="h-12 w-12 rounded-md bg-secondary" />
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
          <Play className="h-4 w-4 fill-white text-white" />
        </span>
      </button>

      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href={`/${track.id}`}
            className="block min-w-0 flex-1 truncate text-sm font-medium hover:underline"
            title={track.name}
          >
            {track.name}
          </Link>
          {badge ? (
            <Badge variant="outline" className="hidden flex-none font-normal sm:inline-flex">
              {badge}
            </Badge>
          ) : null}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {track.artists?.primary?.[0]?.name || "Unknown artist"}
          {track.album?.name ? ` · ${track.album.name}` : ""}
        </p>
        {reason ? (
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground/80">{reason}</p>
        ) : null}
      </div>

      <div className="flex flex-none items-center gap-1">
        <FeedbackButtons track={track} />
        <Button
          asChild
          size="icon"
          variant="ghost"
          className="hidden h-8 w-8 sm:inline-flex"
          title="Open full player"
        >
          <Link href={`/${track.id}`} aria-label={`Open ${track.name}`}>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </Button>
        <Button
          type="button"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={play}
          aria-label={`Play ${track.name}`}
          title={`Play ${track.name}`}
        >
          <Play className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
