"use client";
import { Skeleton } from "../ui/skeleton";
import { useMusicProvider, useTaste } from "@/hooks/use-context";
import { IoPlay } from "react-icons/io5";

export default function SongCard({ title, image, artist, id, desc, track, genre }) {
  const music = useMusicProvider();
  const taste = useTaste();

  const fullTrack =
    track ||
    {
      id,
      name: title || "Untitled",
      genre: genre || "Music",
      image: image ? [{ url: image }] : [],
      album: { id: "", name: "" },
      artists: { primary: [{ id: artist || "unknown", name: artist || "Unknown artist" }] },
      downloadUrl: [],
    };

  const play = () => {
    if (!id) return;
    if (taste?.record) taste.record("play", fullTrack);
    localStorage.setItem("last-played", id);
    if (music?.startQueue) {
      music.startQueue([fullTrack], 0);
    } else {
      music?.setMusic?.(id);
    }
  };

  return (
    <div className="h-fit w-[200px]">
      <div className="overflow-hidden rounded-md">
        {image ? (
          <div className="relative" onClick={play}>
            <img
              src={image}
              alt={title}
              className="h-[182px] blurz w-full bg-secondary/60 rounded-md transition hover:scale-105 cursor-pointer"
            />
            <div className="cursor-pointer absolute z-10 bottom-2 left-2 bg-background/60 backdrop-blur-md rounded-full h-8 w-8 flex items-center justify-center">
              <IoPlay className="w-4 h-4 -mr-0.5 dark:fill-white" />
            </div>
          </div>
        ) : (
          <Skeleton className="w-full h-[182px]" />
        )}
      </div>
      <div className="cursor-pointer">
        {title ? (
          <div
            onClick={play}
            className="mt-3 flex items-center justify-between"
          >
            <h1 className="text-base">
              {title.slice(0, 20)}
              {title.length > 20 && "..."}
            </h1>
          </div>
        ) : (
          <Skeleton className="w-[70%] h-4 mt-2" />
        )}
        {desc && <p className="text-xs text-muted-foreground">{desc.slice(0, 30)}</p>}
        {artist ? (
          <p className="text-sm font-light text-muted-foreground">
            {artist.slice(0, 20)}
            {artist.length > 20 && "..."}
          </p>
        ) : (
          <Skeleton className="w-10 h-2 mt-2" />
        )}
      </div>
    </div>
  );
}
