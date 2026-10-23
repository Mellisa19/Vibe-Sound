"use client";
import AlbumCard from "@/components/cards/album";
import ArtistCard from "@/components/cards/artist";
import SongCard from "@/components/cards/song";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { getSongsByQuery, searchAlbumByQuery } from "@/lib/fetch";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Search({ params }) {
    const query = params.id;

    const [artists, setArtists] = useState([]);
    const [songs, setSongs] = useState([]);
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);

        Promise.allSettled([getSongsByQuery(query), searchAlbumByQuery(query)])
            .then(async ([songsResult, albumsResult]) => {
                if (!active) return;

                if (songsResult.status === "fulfilled") {
                    try {
                        const data = await songsResult.value.json();
                        setSongs(data.data?.results || []);
                        setArtists(data.data?.results || []);
                    } catch {
                        setSongs([]);
                        setArtists([]);
                    }
                }

                if (albumsResult.status === "fulfilled") {
                    try {
                        const data = await albumsResult.value.json();
                        setAlbums(data.data?.results || []);
                    } catch {
                        setAlbums([]);
                    }
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [params.id]);

    return (
        <div className="py-8 px-6 md:px-20 lg:px-32">
            <div className="grid gap-4">
                <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-base font-medium">Search Results</h1>
                        <p className="text-xs text-muted-foreground">Results for &quot;{decodeURI(query)}&quot;</p>
                    </div>
                    <Button asChild size="sm" variant="outline" className="rounded-full">
                        <Link href={`/companion?q=${encodeURIComponent(`Music like ${decodeURI(query)}`)}`}>
                            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Make this a vibe
                        </Link>
                    </Button>
                </div>
                <ScrollArea>
                    <div className="flex gap-4">
                        {songs.length ? songs.map((song) => (
                            <SongCard key={song.id} track={song} id={song.id} image={song.image?.[2]?.url} artist={song.artists?.primary?.[0]?.name || "unknown"} title={song.name} />
                        )) : loading ? (
                            <>
                                <SongCard />
                                <SongCard />
                                <SongCard />
                                <SongCard />
                                <SongCard />
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">No songs found. Try a different search.</p>
                        )}
                    </div>
                    <ScrollBar orientation="horizontal" className="hidden sm:flex" />
                </ScrollArea>

                <div className="mt-8">
                    <h1 className="text-base">Related Albums</h1>
                    <p className="text-xs text-muted-foreground">Albums related to &quot;{decodeURI(query)}&quot;</p>
                </div>
                <ScrollArea className="whitespace-nowrap pb-4">
                    <div className="flex gap-4">
                        {albums.length ? albums.map((album) => (
                            <AlbumCard key={album.id} lang={album.language} desc={album.description || null} id={`album/${album.id}`} image={album.image?.[2]?.url} title={album.name} artist={album.artists?.primary?.[0]?.name || "unknown"} />
                        )) : loading ? (
                            <>
                                <SongCard />
                                <SongCard />
                                <SongCard />
                                <SongCard />
                                <SongCard />
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">No related albums found.</p>
                        )}
                    </div>
                    <ScrollBar orientation="horizontal" className="hidden sm:flex" />
                </ScrollArea>

                <div className="mt-4">
                    <h1 className="text-base font-medium">Related Artists</h1>
                    <p className="text-xs text-muted-foreground">Artists related to &quot;{decodeURI(query)}&quot;</p>
                </div>
                <ScrollArea>
                    {artists.length > 0 ? (
                        <div className="flex gap-4">
                            {[...new Set(artists.map(a => a.artists.primary[0]?.id))].map(id => {
                                const entry = artists.find(a => a.artists.primary[0]?.id === id);
                                const artist = entry?.artists?.primary?.[0];
                                if (!artist?.name) return null;
                                return (
                                    <ArtistCard
                                        key={id}
                                        id={id}
                                        image={artist.image?.[2]?.url || `https://az-avatar.vercel.app/api/avatar/?bgColor=0f0f0f0&fontSize=60&text=${artist.name.split("")[0].toUpperCase()}`}
                                        name={artist.name}
                                    />
                                );
                            })}
                        </div>
                    ) : loading ? (
                        <div className="flex gap-3">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <div key={index}>
                                    <Skeleton className="h-[100px] w-[100px] rounded-2xl" />
                                    <Skeleton className="h-3 mt-2 w-10" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No related artists found.</p>
                    )}
                    <ScrollBar orientation="horizontal" className="hidden sm:flex" />
                </ScrollArea>
            </div>
        </div>
    )
}
