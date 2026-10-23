import Link from "next/link";
import { Compass, Globe2, Sparkles } from "lucide-react";
import ArtistCard from "@/components/cards/artist";
import AlbumCard from "@/components/cards/album";
import PlayCollectionButton from "@/components/tracks/play-collection-button";
import TrackRow from "@/components/tracks/track-row";
import { Badge } from "@/components/ui/badge";
import { getAfricanDiscovery } from "@/lib/music/catalogue";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "African Artist Discovery",
  description:
    "Discover Afrobeats, Amapiano, Alté, Highlife, Gengetone and Bongo Flava through live artist and release metadata.",
};

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }) {
  const requested = Array.isArray(searchParams?.scene)
    ? searchParams.scene[0]
    : searchParams?.scene;
  const data = await getAfricanDiscovery({ scene: requested });

  const artists = [...(data.artists || [])].sort((a, b) => {
    if (a.rising !== b.rising) return a.rising ? -1 : 1;
    return new Date(b.latestRelease || 0) - new Date(a.latestRelease || 0);
  });

  const fresh = data.fresh || [];

  return (
    <main className="px-6 py-8 md:px-20 lg:px-32">
      <div className="flex flex-wrap items-center gap-2">
        <Compass className="h-4 w-4" />
        <h1 className="text-base font-medium">African artist discovery</h1>
        <Badge variant="outline" className="font-normal">
          Live catalogue · 5 countries
        </Badge>
      </div>
      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Explore emerging and established voices across Afrobeats, Amapiano, Alté,
        Highlife, Gengetone and Bongo Flava. Every artist and release below comes
        from live Apple Music metadata — nothing is invented.
      </p>

      <div className="mt-5 flex flex-wrap gap-1.5">
        <Link
          href="/africa"
          className={cn(
            "rounded-full border border-border px-3 py-1.5 text-xs transition",
            data.selectedScene === "all"
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:bg-secondary/60",
          )}
        >
          All scenes
        </Link>
        {data.scenes?.map((scene) => (
          <Link
            key={scene.id}
            href={`/africa?scene=${scene.id}`}
            className={cn(
              "rounded-full border border-border px-3 py-1.5 text-xs transition",
              data.selectedScene === scene.id
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary/60",
            )}
          >
            {scene.label}
            <span className="ml-1.5 text-[10px] opacity-60">{scene.countryLabel}</span>
          </Link>
        ))}
      </div>

      <section className="mt-9">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-medium">Artists to know</h2>
              <Badge variant="outline" className="font-normal">
                <Sparkles className="mr-1 h-3 w-3" /> Fresh releases
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Sorted by recent releases. “Fresh” marks a recent release with a light
              presence in this catalogue sample — a discovery signal, not a chart.
            </p>
          </div>
          <span className="text-[11px] text-muted-foreground">{artists.length} artists</span>
        </div>

        {artists.length ? (
          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {artists.map((artist) => (
              <div key={artist.id} className="flex flex-col items-center">
                <ArtistCard image={artist.image} name={artist.name} id={artist.id} />
                <div className="mt-1.5 flex flex-col items-center gap-1 text-center">
                  {artist.rising ? (
                    <Badge variant="secondary" className="font-normal">
                      Fresh
                    </Badge>
                  ) : null}
                  <span className="text-[10px] text-muted-foreground">
                    {artist.scene?.label || artist.genre}
                    {artist.scene?.country ? ` · ${artist.scene.country}` : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No artist metadata available right now. Try another scene.
          </p>
        )}
      </section>

      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-medium">Fresh African releases</h2>
            <p className="text-xs text-muted-foreground">
              Newest tracks in the current scene, playable as 30-second previews.
            </p>
          </div>
          <PlayCollectionButton tracks={fresh} label="Play fresh picks" />
        </div>

        <div className="mt-5 grid gap-2 md:grid-cols-2">
          {fresh.slice(0, 14).map((track) => (
            <TrackRow
              key={track.id}
              track={track}
              reason={`${track.scene?.label || track.genre} · ${track.scene?.country || "Africa"}`}
            />
          ))}
        </div>
        {!fresh.length ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No fresh releases found for this scene.
          </p>
        ) : null}
      </section>

      <section className="mt-12">
        <div className="flex items-center gap-2">
          <Globe2 className="h-4 w-4" />
          <h2 className="text-base font-medium">African albums on the chart</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Current Apple Music album chart entries from Nigeria.
        </p>
        <div className="mt-5 flex flex-wrap gap-5">
          {data.albums?.map((album) => (
            <AlbumCard
              key={album.id}
              lang={album.language}
              image={album.image?.[2]?.url}
              album={album.name}
              title={album.name}
              artist={album.artists?.primary?.[0]?.name}
              id={`album/${album.id}`}
            />
          ))}
        </div>
        {!data.albums?.length ? (
          <p className="mt-4 text-sm text-muted-foreground">No album chart data available.</p>
        ) : null}
      </section>

      <p className="mt-12 rounded-md border border-dashed p-4 text-[11px] leading-relaxed text-muted-foreground">
        <strong className="font-medium text-foreground">About this data.</strong>{" "}
        {data.meta?.method} Coverage and availability depend on Apple&apos;s public
        catalogue. Playback uses 30-second previews, not full-length streams.
      </p>
    </main>
  );
}
