"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Compass, Sparkles, Waves } from "lucide-react";
import AlbumCard from "@/components/cards/album";
import ArtistCard from "@/components/cards/artist";
import SongCard from "@/components/cards/song";
import ForYouStrip from "@/components/sections/for-you-strip";
import VibePrompt from "@/components/sections/vibe-prompt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { getHomeFeed } from "@/lib/fetch";

function SectionHeading({ title, subtitle, href, linkLabel }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h1 className="text-base font-medium">{title}</h1>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {href ? (
        <Link
          href={href}
          className="flex flex-none items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground"
        >
          {linkLabel || "See all"} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </div>
  );
}

function SongSkeletonRow({ count = 10 }) {
  return Array.from({ length: count }).map((_, index) => (
    <div key={index} className="w-[200px]">
      <Skeleton className="h-[182px] w-full" />
      <Skeleton className="mt-3 h-4 w-3/4" />
      <Skeleton className="mt-2 h-3 w-1/2" />
    </div>
  ));
}

export default function Page() {
  const [home, setHome] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    getHomeFeed()
      .then((response) => response.json())
      .then((payload) => {
        if (active) setHome(payload.data);
      })
      .catch(() => {
        if (active) setError("The live music catalogue is unavailable right now.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const latest = home?.latest || [];
  const albums = home?.albums || [];
  const artists = home?.artists || [];
  const trending = home?.trending || [];
  const spotlight = home?.africanSpotlight || [];

  return (
    <main className="px-6 py-5 md:px-20 lg:px-32">
      <section className="rounded-2xl border border-border bg-secondary/10 p-5 md:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1 font-normal">
            <Sparkles className="h-3 w-3" /> AI music discovery
          </Badge>
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            VibeSound AI
          </span>
        </div>
        <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight md:text-5xl">
          Your mood. Your music.{" "}
          <span className="text-muted-foreground">Your discovery.</span>
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Describe the moment in ordinary language. VibeSound reads mood, activity,
          genre and energy, then builds a playable mix from real catalogue metadata —
          with a spotlight on emerging African artists.
        </p>
        <VibePrompt className="mt-5 max-w-2xl" />
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild size="sm" variant="secondary" className="rounded-full">
            <Link href="/companion">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Open AI Companion
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="rounded-full">
            <Link href="/africa">
              <Compass className="mr-1.5 h-3.5 w-3.5" /> Discover African artists
            </Link>
          </Button>
          <Button asChild size="sm" variant="ghost" className="rounded-full">
            <Link href="/journey">
              <Waves className="mr-1.5 h-3.5 w-3.5" /> Build a playlist journey
            </Link>
          </Button>
        </div>
      </section>

      {error ? (
        <div className="mt-8 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          {error} Check your network connection and refresh.
        </div>
      ) : null}

      <div className="mt-10">
        <ForYouStrip />
      </div>

      <div className="mt-12">
        <SectionHeading
          title="Songs"
          subtitle="Fresh Afrobeats and Amapiano from the live catalogue."
        />
        <ScrollArea className="rounded-md mt-4">
          <div className="flex gap-4">
            {latest.length
              ? latest.map((song) => (
                  <SongCard
                    key={song.id}
                    track={song}
                    image={song.image?.[2]?.url}
                    album={song.album?.name}
                    title={song.name}
                    artist={song.artists?.primary?.[0]?.name}
                    id={song.id}
                  />
                ))
              : loading
                ? <SongSkeletonRow />
                : <p className="text-sm text-muted-foreground">No songs available.</p>}
          </div>
          <ScrollBar orientation="horizontal" className="hidden sm:flex" />
        </ScrollArea>
      </div>

      <div className="mt-14">
        <SectionHeading
          title="Albums"
          subtitle="New albums from African and global artists."
        />
        <ScrollArea className="rounded-md mt-6">
          <div className="flex gap-4">
            {albums.length
              ? albums.map((album) => (
                  <AlbumCard
                    key={album.id}
                    lang={album.language}
                    image={album.image?.[2]?.url}
                    album={album.name}
                    title={album.name}
                    artist={album.artists?.primary?.[0]?.name}
                    id={`album/${album.id}`}
                  />
                ))
              : loading
                ? <SongSkeletonRow />
                : <p className="text-sm text-muted-foreground">No albums available.</p>}
          </div>
          <ScrollBar orientation="horizontal" className="hidden sm:flex" />
        </ScrollArea>
      </div>

      <div className="mt-12">
        <SectionHeading
          title="Artists"
          subtitle="Voices behind the tracks on this page."
        />
        <ScrollArea className="rounded-md mt-6">
          <div className="flex gap-4">
            {artists.length
              ? artists.map((artist) => (
                  <ArtistCard
                    key={artist.id}
                    id={artist.id}
                    image={artist.image}
                    name={artist.name}
                  />
                ))
              : loading
                ? Array.from({ length: 10 }).map((_, index) => (
                    <div key={index} className="grid gap-2">
                      <Skeleton className="h-[100px] w-[100px] rounded-full" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  ))
                : <p className="text-sm text-muted-foreground">No artists available.</p>}
          </div>
          <ScrollBar orientation="horizontal" className="hidden sm:flex" />
        </ScrollArea>
      </div>

      <div className="mt-12">
        <SectionHeading
          title="Trending"
          subtitle="Real chart entries from Apple Music in South Africa and the US."
          href="/africa"
          linkLabel="African discovery"
        />
        <ScrollArea className="rounded-md mt-6">
          <div className="flex gap-4">
            {trending.length
              ? trending.map((song) => (
                  <SongCard
                    key={song.id}
                    track={song}
                    id={song.id}
                    image={song.image?.[2]?.url}
                    title={song.name}
                    artist={song.artists?.primary?.[0]?.name}
                  />
                ))
              : loading
                ? <SongSkeletonRow />
                : <p className="text-sm text-muted-foreground">No chart data available.</p>}
          </div>
          <ScrollBar orientation="horizontal" className="hidden sm:flex" />
        </ScrollArea>
      </div>

      <section className="mt-14 rounded-xl border border-border bg-secondary/10 p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4" />
              <h2 className="text-base font-medium">African artist discovery</h2>
              <Badge variant="outline" className="font-normal">Live catalogue</Badge>
            </div>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              Explore Afrobeats, Amapiano, Alté, Highlife, Gengetone and Bongo Flava
              through real artist and release metadata from Nigeria, South Africa,
              Ghana, Kenya and Tanzania.
            </p>
          </div>
          <Button asChild className="flex-none rounded-full">
            <Link href="/africa">
              Explore the scene <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <ScrollArea className="mt-5 rounded-md">
          <div className="flex gap-4">
            {spotlight.length
              ? spotlight.map((song) => (
                  <SongCard
                    key={song.id}
                    track={song}
                    id={song.id}
                    image={song.image?.[2]?.url}
                    title={song.name}
                    artist={song.artists?.primary?.[0]?.name}
                  />
                ))
              : loading
                ? <SongSkeletonRow count={6} />
                : <p className="text-sm text-muted-foreground">No African spotlight tracks available.</p>}
          </div>
          <ScrollBar orientation="horizontal" className="hidden sm:flex" />
        </ScrollArea>
      </section>

      <Link
        href="/journey"
        className="mt-8 flex flex-col justify-between gap-3 rounded-xl border border-border p-5 transition hover:bg-secondary/20 sm:flex-row sm:items-center"
      >
        <div>
          <h2 className="text-base font-medium">A playlist that moves with you</h2>
          <p className="text-xs text-muted-foreground">
            Ask for an arc — calm to euphoric, focus to party — and VibeSound builds
            an ordered, playable journey.
          </p>
        </div>
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          Open Journey <ArrowRight className="h-4 w-4" />
        </span>
      </Link>
    </main>
  );
}
