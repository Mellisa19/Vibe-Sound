"use client";

import Next from "@/components/cards/next";
import { Skeleton } from "@/components/ui/skeleton";
import { useNextMusicProvider } from "@/hooks/use-context";
import { getSongsSuggestions } from "@/lib/fetch";
import { useEffect, useState } from "react";

export default function Recomandation({ id }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const next = useNextMusicProvider();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setData([]);

    getSongsSuggestions(id)
      .then((res) => res.json())
      .then((payload) => {
        if (!active) return;
        const tracks = Array.isArray(payload?.data) ? payload.data : [];
        if (!tracks.length) {
          setData([]);
          return;
        }

        setData(tracks);
        const pick = tracks[Math.floor(Math.random() * tracks.length)];
        if (pick?.id) {
          next.setNextData({
            id: pick.id,
            name: pick.name,
            artist: pick.artists?.primary?.[0]?.name || "unknown",
            album: pick.album?.name,
            image: pick.image?.[1]?.url,
          });
        }
      })
      .catch(() => {
        if (active) setData([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <section className="py-10 px-6 md:px-20 lg:px-32">
      <div>
        <h1 className="text-base font-medium">Recommendation</h1>
        <p className="text-xs text-muted-foreground">You might like this</p>
      </div>
      <div className="rounded-md mt-6">
        {!loading && data.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-3 overflow-hidden">
            {data.map((song) => (
              <Next
                next={false}
                key={song.id}
                image={song.image?.[2]?.url}
                name={song.name}
                artist={song.artists?.primary?.[0]?.name || "unknown"}
                id={song.id}
              />
            ))}
          </div>
        )}
        {loading && (
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="grid gap-2">
                <Skeleton className="h-14 w-full" />
              </div>
            ))}
          </div>
        )}
      </div>
      {!loading && data.length === 0 && (
        <div className="flex items-center justify-center border border-dashed text-center h-[100px]">
          <p className="text-sm text-muted-foreground">
            No recommendations for this track yet.
          </p>
        </div>
      )}
    </section>
  );
}
