"use client";

import { Bookmark, Heart } from "lucide-react";
import { useTaste } from "@/hooks/use-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Explicit feedback controls used wherever a track is recommended.
 * Like and save both feed the on-device taste profile immediately.
 */
export default function FeedbackButtons({ track, className, compact = false }) {
  const taste = useTaste();
  if (!taste || !track?.id) return null;

  const liked = taste.isLiked(track.id);
  const saved = taste.isSaved(track.id);

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className={cn("h-8 w-8", liked && "bg-secondary")}
        title={liked ? "Remove like" : "Like this track"}
        aria-pressed={liked}
        aria-label={liked ? "Remove like" : "Like this track"}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          taste.toggleLike(track);
        }}
      >
        <Heart className={cn("h-4 w-4", liked && "fill-current")} />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className={cn("h-8 w-8", saved && "bg-secondary")}
        title={saved ? "Remove from saved" : "Save this track"}
        aria-pressed={saved}
        aria-label={saved ? "Remove from saved" : "Save this track"}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          taste.toggleSave(track);
        }}
      >
        <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
      </Button>
      {!compact && null}
    </div>
  );
}
