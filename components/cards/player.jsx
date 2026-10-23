"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import {
  ExternalLink,
  Play,
  Repeat,
  Repeat1,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import { Slider } from "../ui/slider";
import { getSongsById } from "@/lib/fetch";
import Link from "next/link";
import { useMusicProvider, useTaste } from "@/hooks/use-context";
import { toast } from "sonner";
import { Skeleton } from "../ui/skeleton";
import { IoPause } from "react-icons/io5";
import FeedbackButtons from "../taste/feedback-buttons";

export default function Player() {
  const [data, setData] = useState(null);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioURL, setAudioURL] = useState("");
  const [isLooping, setIsLooping] = useState(false);
  const recordedRef = useRef(null);
  const {
    music,
    setMusic,
    current,
    setCurrent,
    queue,
    queueIndex,
    hasNext,
    hasPrevious,
    nextTrack,
    previousTrack,
    clearQueue,
  } = useMusicProvider();
  const taste = useTaste();

  const getSong = async () => {
    try {
      const response = await getSongsById(music);
      const payload = await response.json();
      const track = payload?.data?.[0] || null;
      setData(track);

      if (!track) return;
      const url =
        track.downloadUrl?.[2]?.url ||
        track.downloadUrl?.[1]?.url ||
        track.downloadUrl?.[0]?.url ||
        track.previewUrl ||
        "";
      setAudioURL(url);

      if (!url) {
        toast.error("No playable preview is available for this track.");
      }
    } catch {
      toast.error("Could not load that track from the catalogue.");
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      localStorage.setItem("p", "false");
    } else {
      audioRef.current.play().catch(() => {
        toast.error("Playback was blocked. Tap play again.");
      });
      localStorage.setItem("p", "true");
    }
    setPlaying(!playing);
  };

  const handleSeek = (value) => {
    const seekTime = value[0];
    if (!audioRef.current) return;
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const loopSong = () => {
    if (!audioRef.current) return;
    audioRef.current.loop = !audioRef.current.loop;
    setIsLooping(!isLooping);
  };

  const skipToNext = () => {
    if (data && taste?.record) taste.record("skip", data);
    if (hasNext) {
      nextTrack();
    } else {
      toast("Skipped. The more you skip, the more your mix adapts.");
    }
  };

  const closePlayer = () => {
    audioRef.current?.pause();
    setMusic(null);
    setCurrent(0);
    clearQueue();
    try {
      localStorage.removeItem("last-played");
      localStorage.removeItem("p");
    } catch {
      // storage may be unavailable
    }
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }
    setAudioURL("");
    setData(null);
    setPlaying(false);
  };

  useEffect(() => {
    if (!music) return;

    getSong();
    setPlaying(localStorage.getItem("p") !== "false");

    if (current) {
      try {
        audioRef.current.currentTime = parseFloat(current + 1);
      } catch {
        // ignore stale position
      }
    }

    const audio = audioRef.current;
    const handleTimeUpdate = () => {
      if (!audio) return;
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
      setCurrent(audio.currentTime);
    };
    audio?.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      audio?.removeEventListener("timeupdate", handleTimeUpdate);
    };
    // The player intentionally reloads only when the selected track changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [music]);

  useEffect(() => {
    if (!audioURL || !playing) return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.play().catch(() => {
      setPlaying(false);
    });
  }, [audioURL]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (data?.id && recordedRef.current !== data.id && taste?.record) {
      recordedRef.current = data.id;
      taste.record("play", data);
    }
  }, [data, taste]);

  const handleEnded = () => {
    if (isLooping) return;
    if (hasNext) {
      nextTrack();
    } else {
      setPlaying(false);
    }
  };

  return (
    <main>
      <audio
        autoPlay={playing}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={handleEnded}
        onLoadedData={() => setDuration(audioRef.current?.duration || 0)}
        src={audioURL}
        ref={audioRef}
      ></audio>
      {music && (
        <div className="shadow-lg fixed grid bottom-0 max-w-[500px] md:border-l md:border-r md:rounded-md md:!rounded-b-none md:ml-auto right-0 left-0 border-border overflow-hidden border-t-none z-50 bg-background gap-3">
          <div className="w-full">
            {!duration ? (
              <Skeleton className="h-1 w-full" />
            ) : (
              <Slider
                thumbClassName="hidden"
                trackClassName="h-1 transition-[height] group-hover:h-2 rounded-none"
                onValueChange={handleSeek}
                value={[Math.min(currentTime, duration || 0)]}
                max={duration}
                className="w-full group"
                aria-label="Playback position"
              />
            )}
          </div>
          <div className="grid gap-2 p-3 pt-0">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex items-center gap-2 w-full min-w-0">
                <img
                  src={data?.image?.[1]?.url || ""}
                  alt={data?.name || ""}
                  className="rounded-md aspect-square h-12 w-12 bg-secondary hover:opacity-85 transition cursor-pointer"
                />
                <img
                  src={data?.image?.[1]?.url || ""}
                  alt=""
                  className="rounded-md h-[110%] min-w-[110%] opacity-40 hidden dark:block absolute top-0 left-0 right-0 blur-3xl -z-10"
                />
                <div className="min-w-0">
                  {!data?.name ? (
                    <Skeleton className="h-4 w-32" />
                  ) : (
                    <Link
                      href={`/${music}`}
                      className="text-base flex hover:opacity-85 transition font-medium gap-2 items-center"
                    >
                      <span className="truncate sm:max-w-[180px] max-w-[140px]">
                        {data?.name}
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    </Link>
                  )}

                  {!data?.artists?.primary?.[0]?.name ? (
                    <Skeleton className="h-3 w-14 mt-1" />
                  ) : (
                    <h2 className="text-xs -mt-0.5 text-muted-foreground truncate max-w-[180px]">
                      {data.artists.primary[0].name}
                    </h2>
                  )}
                  {queue.length > 1 ? (
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {queueIndex + 1} / {queue.length} in queue
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 flex-none">
                <Button
                  size="icon"
                  className="hidden sm:inline-flex p-0 h-9 w-9"
                  variant="ghost"
                  onClick={previousTrack}
                  disabled={!hasPrevious}
                  title="Previous track"
                  aria-label="Previous track"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  className="hidden sm:inline-flex p-0 h-9 w-9"
                  variant="ghost"
                  onClick={skipToNext}
                  title="Skip to next"
                  aria-label="Skip to next track"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  className="p-0 h-9 w-9"
                  onClick={togglePlayPause}
                  aria-label={playing ? "Pause" : "Play"}
                >
                  {playing ? (
                    <IoPause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="icon"
                  className="hidden sm:inline-flex p-0 h-9 w-9"
                  variant="ghost"
                  onClick={loopSong}
                  title={isLooping ? "Looping this track" : "Loop this track"}
                  aria-label={isLooping ? "Looping this track" : "Loop this track"}
                >
                  {!isLooping ? (
                    <Repeat className="h-3.5 w-3.5" />
                  ) : (
                    <Repeat1 className="h-3.5 w-3.5" />
                  )}
                </Button>
                <div className="hidden sm:block">
                  <FeedbackButtons track={data} compact />
                </div>
                <Button
                  size="icon"
                  className="p-0 h-9 w-9"
                  variant="secondary"
                  onClick={closePlayer}
                  aria-label="Close player"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{duration ? formatTime(duration) : "--:--"}</span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
