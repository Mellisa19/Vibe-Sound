"use client";

import { ListMusic, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMusicProvider, useTaste } from "@/hooks/use-context";

export default function PlayCollectionButton({
  tracks = [],
  label = "Play all",
  className,
}) {
  const music = useMusicProvider();
  const taste = useTaste();
  const playable = tracks.filter((track) => track?.id);

  const start = () => {
    if (!playable.length) return;
    if (taste?.record) taste.record("play", playable[0]);
    localStorage.setItem("last-played", playable[0].id);
    music?.startQueue?.(playable, 0);
  };

  return (
    <Button
      type="button"
      className={className}
      onClick={start}
      disabled={!playable.length}
      title={playable.length ? `Play ${playable.length} tracks` : "No playable tracks"}
    >
      <Play className="mr-2 h-4 w-4" />
      {label}
      <span className="ml-2 text-xs opacity-70">{playable.length}</span>
    </Button>
  );
}
