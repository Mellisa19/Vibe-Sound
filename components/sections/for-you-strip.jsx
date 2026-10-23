"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import SongCard from "@/components/cards/song";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useTaste } from "@/hooks/use-context";
import { getForYouFeed } from "@/lib/fetch";

/**
 * Home-page personalisation strip. It asks the server to rank live catalogue
 * tracks using the local taste profile, then renders them with the existing
 * SongCard component.
 */
export default function ForYouStrip() {
  const taste = useTaste();
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
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [ready, updatedAt]);

  const tracks = data?.tracks || [];

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-medium">
              {data?.personalised ? "Made for you" : "Start here"}
            </h2>
            <Badge variant="outline" className="font-normal">
              {data?.personalised ? "Personalised on this device" : "Starter mix"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {data?.summary || "Learning from plays, likes, saves and skips on this device."}
          </p>
        </div>
        <Link
          href="/for-you"
          className="hidden items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground sm:flex"
        >
          See your mix <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <ScrollArea className="mt-4 rounded-md">
        <div className="flex gap-4 pb-2">
          {loading || !data
            ? Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="w-[200px]">
                  <Skeleton className="h-[182px] w-full" />
                  <Skeleton className="mt-3 h-4 w-3/4" />
                  <Skeleton className="mt-2 h-3 w-1/2" />
                </div>
              ))
            : tracks.map((track) => (
                <SongCard
                  key={track.id}
                  track={track}
                  id={track.id}
                  image={track.image?.[2]?.url || track.image?.[0]?.url}
                  title={track.name}
                  artist={track.artists?.primary?.[0]?.name}
                  genre={track.genre}
                />
              ))}
        </div>
        <ScrollBar orientation="horizontal" className="hidden sm:flex" />
      </ScrollArea>

      {!loading && !tracks.length ? (
        <div className="mt-4 flex items-center gap-2 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          {error || "No playable recommendations yet. Try the AI Companion."}
        </div>
      ) : null}
    </section>
  );
}
