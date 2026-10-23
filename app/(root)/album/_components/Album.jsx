"use client"

import SongCard from "@/components/cards/song";
import PlayCollectionButton from "@/components/tracks/play-collection-button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { getAlbumById } from "@/lib/fetch";
import { useEffect, useState } from "react"

export default function Album({ id }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        getAlbumById(id)
            .then(res => res.json())
            .then(payload => {
                if (active) setData(payload.data);
            })
            .catch(() => {
                if (active) setData(null);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, [id]);

    if (!loading && !data) {
        return (
            <main className="px-6 md:px-20 lg:px-32 py-10">
                <h1 className="text-lg font-medium">Album unavailable</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    The catalogue did not return this album. It may be region-restricted.
                </p>
            </main>
        );
    }

    return (
        <main className="px-6 md:px-20 lg:px-32 py-5">
            {data?.image ? (
                <div>
                    <div className="md:flex gap-10">
                        <img src={data.image[2]?.url} alt={data.name} className="w-full md:w-[200px] md:h-[200px] rounded-2xl" />
                        <div className="mt-5 mb-1">
                            <h1 className="text-xl font-medium">{data.name}</h1>
                            <p className="text-sm text-muted-foreground mt-1">{data.description}</p>
                            <p className="text-sm text-muted-foreground mb-1">by <span className="text-primary">{data.artists?.primary?.map(artist => artist.name).join(", ")}</span></p>
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge>
                                    {data.songCount || data.songs?.length || 0} songs
                                </Badge>
                                {data.language ? <Badge variant="outline">{data.language}</Badge> : null}
                            </div>
                            <div className="mt-4">
                                <PlayCollectionButton tracks={data.songs || []} label="Play album" />
                            </div>
                        </div>
                    </div>
                    <div className="mt-12">
                        <ScrollArea className="rounded-md mt-4">
                            <div className="flex gap-3">
                                {data.songs?.map((song) => (
                                    <SongCard key={song.id} track={song} image={song.image?.[2]?.url} title={song.name} artist={song.artists?.primary?.[0]?.name} id={song.id} />
                                ))}
                            </div>
                            <ScrollBar orientation="horizontal" className="hidden sm:flex" />
                        </ScrollArea>
                    </div>
                </div>
            ) : (
                <>
                    <Skeleton className="md:h-[200px] md:w-[200px] rounded-2xl w-full h-[400px]" />
                    <Skeleton className="h-4 mt-4 w-32" />
                    <Skeleton className="h-3 mt-3 mb-1.5 w-40" />
                    <Skeleton className="h-3 w-14" />
                    <Skeleton className="h-6 mt-2 mb-8 w-20" />
                    <ScrollArea className="rounded-md mt-4">
                        <div className="flex gap-6">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <div key={index} className="grid gap-2">
                                    <Skeleton className="h-[200px] w-[200px]" />
                                    <Skeleton className="h-4 w-28" />
                                    <Skeleton className="h-3 w-20 -mt-1" />
                                </div>
                            ))}
                        </div>
                        <ScrollBar orientation="horizontal" className="hidden sm:flex" />
                    </ScrollArea>
                </>
            )
            }
        </main >
    )
}
