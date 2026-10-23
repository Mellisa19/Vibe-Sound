"use client";
import { Button } from "@/components/ui/button";
import { getSongsById } from "@/lib/fetch";
import { Download, Play, Repeat, Repeat1, RotateCcw, Share2, SkipForward } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import Link from "next/link";
import {
  useMusicProvider,
  useNextMusicProvider,
  useTaste,
} from "@/hooks/use-context";
import Next from "@/components/cards/next";
import FeedbackButtons from "@/components/taste/feedback-buttons";
import { IoPause } from "react-icons/io5";

export default function Player({ id }) {
  const [data, setData] = useState([]);
  const [playing, setPlaying] = useState(true);
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const [loadError, setLoadError] = useState(false);
  const recordedRef = useRef(null);
  const next = useNextMusicProvider();
  const taste = useTaste();
  const { current, setCurrent, setDownloadProgress, downloadProgress } =
    useMusicProvider();

  const getSong = async () => {
    try {
      const response = await getSongsById(id);
      const payload = await response.json();
      const track = payload?.data?.[0] || null;
      if (!track) {
        setLoadError(true);
        return;
      }
      setData(track);
      setAudioURL(
        track.downloadUrl?.[2]?.url ||
          track.downloadUrl?.[1]?.url ||
          track.downloadUrl?.[0]?.url ||
          track.previewUrl ||
          "",
      );
    } catch {
      setLoadError(true);
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

  const downloadSong = async () => {
    if (isDownloading) {
      setDownloadProgress(0);
      setIsDownloading(false);
      return;
    }
    if (!audioURL) {
      toast.error("No preview is available to download.");
      return;
    }
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const response = await fetch(audioURL);
      if (!response.ok) throw new Error("Failed to fetch");

      const contentLength = response.headers.get("Content-Length");
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      let loaded = 0;

      const reader = response.body.getReader();
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          loaded += value.length;
          if (total) {
            setDownloadProgress(Math.round((loaded / total) * 100));
          }
        }
      }

      const blob = new Blob(chunks);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.name}.m4a`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Downloaded the 30-second preview.");
    } catch {
      toast.error("Download failed.");
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
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

  const replay = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
    setPlaying(true);
    if (data?.id && taste?.record) taste.record("replay", data);
  };

  const skipTrack = () => {
    if (data?.id && taste?.record) taste.record("skip", data);
    if (next?.nextData?.id) {
      window.location.href = `/${next.nextData.id}`;
    } else {
      toast("Noted — that skip will shape your recommendations.");
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/${data.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: data.name, text: `Listening to ${data.name}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied.");
      }
    } catch {
      // User cancelled the share sheet; no need to show an error.
    }
  };

  useEffect(() => {
    getSong();
    try {
      localStorage.setItem("last-played", id);
      localStorage.removeItem("p");
    } catch {
      // storage may be unavailable
    }
    if (current) {
      try {
        audioRef.current.currentTime = parseFloat(current + 1);
      } catch {
        // ignore stale position
      }
    }
    const handleTimeUpdate = () => {
      if (!audioRef.current) return;
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
      setCurrent(audioRef.current.currentTime);
    };
    audioRef.current?.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      audioRef.current?.removeEventListener("timeupdate", handleTimeUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (data?.id && recordedRef.current !== data.id && taste?.record) {
      recordedRef.current = data.id;
      taste.record("play", data);
    }
  }, [data, taste]);

  useEffect(() => {
    const handleRedirect = () => {
      if (currentTime === duration && !isLooping && duration !== 0) {
        if (data?.id && taste?.record) taste.record("complete", data);
        if (next?.nextData?.id) {
          window.location.href = `/${next.nextData.id}`;
        }
      }
    };
    if (isLooping || duration === 0) return;
    handleRedirect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, duration, isLooping, next?.nextData?.id]);

  return (
    <div className="mb-3 mt-10">
      <audio
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedData={() => setDuration(audioRef.current?.duration || 0)}
        autoPlay={playing}
        src={audioURL}
        ref={audioRef}
      ></audio>
      <div className="grid gap-6 w-full">
        {loadError ? (
          <div className="px-6 md:px-20 lg:px-32">
            <h1 className="text-lg font-medium">Track unavailable</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              The catalogue did not return a playable track. It may be region-restricted.
            </p>
            <Button asChild className="mt-4" variant="outline">
              <Link href="/">Back to discovery</Link>
            </Button>
          </div>
        ) : (
        <div className="sm:flex px-6 md:px-20 lg:px-32 grid gap-5 w-full">
          <div>
            {data.length <= 0 ? (
              <Skeleton className="md:w-[130px] aspect-square rounded-2xl md:h-[150px]" />
            ) : (
              <div className="relative">
                <img
                  src={data.image?.[2]?.url}
                  className="sm:h-[150px] h-full aspect-square bg-secondary/50 rounded-2xl sm:w-[200px] w-full sm:mx-0 mx-auto object-cover"
                  alt={data.name}
                />
                <img
                  src={data.image?.[2]?.url}
                  className="hidden dark:block absolute top-0 left-0 w-[110%] h-[110%] blur-3xl -z-10 opacity-50"
                  alt=""
                />
              </div>
            )}
          </div>
          {data.length <= 0 ? (
            <div className="flex flex-col justify-between w-full">
              <div>
                <Skeleton className="h-4 w-36 mb-2" />
                <Skeleton className="h-3 w-16 mb-4" />
              </div>
              <div>
                <Skeleton className="h-4 w-full rounded-full mb-2" />
                <div className="w-full flex items-center justify-between">
                  <Skeleton className="h-[9px] w-6" />
                  <Skeleton className="h-[9px] w-6" />
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <Skeleton className="h-10 w-10" />
                  <Skeleton className="h-10 w-10" />
                  <Skeleton className="h-10 w-10" />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-between w-full">
              <div className="sm:mt-0 mt-3">
                <h1 className="text-xl font-bold md:max-w-lg">{data.name}</h1>
                <p className="text-sm text-muted-foreground">
                  by{" "}
                  <Link
                    href={
                      "/search/" +
                      `${encodeURI(data.artists.primary[0].name.toLowerCase().split(" ").join("+"))}`
                    }
                    className="text-foreground"
                  >
                    {data.artists.primary[0]?.name || "unknown"}
                  </Link>
                </p>
                {data.album?.name ? (
                  <p className="text-xs text-muted-foreground mt-0.5">{data.album.name}</p>
                ) : null}
              </div>
              <div className="grid gap-2 w-full mt-5 sm:mt-0">
                <Slider
                  onValueChange={handleSeek}
                  value={[Math.min(currentTime, duration || 0)]}
                  max={duration}
                  className="w-full"
                  aria-label="Playback position"
                />
                <div className="w-full flex items-center justify-between">
                  <span className="text-sm">{formatTime(currentTime)}</span>
                  <span className="text-sm">{formatTime(duration)}</span>
                </div>
                <div className="flex items-center mt-1 justify-between w-full sm:mt-2">
                  <div className="flex items-center gap-1">
                    <Button
                      variant={playing ? "default" : "secondary"}
                      className="gap-1 rounded-full"
                      onClick={togglePlayPause}
                    >
                      {playing ? (
                        <IoPause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      {playing ? "Pause" : "Play"}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={replay}
                      title="Replay from the start"
                      aria-label="Replay from the start"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={skipTrack}
                      title="Not for me — skip and teach the mix"
                      aria-label="Skip this track"
                    >
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 sm:mt-0">
                    <FeedbackButtons track={data} />
                    <Button size="icon" variant="ghost" onClick={loopSong} title="Loop this track">
                      {!isLooping ? (
                        <Repeat className="h-4 w-4" />
                      ) : (
                        <Repeat1 className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant={!isDownloading ? "ghost" : "secondary"}
                      onClick={downloadSong}
                      title="Download 30-second preview"
                    >
                      {isDownloading ? (
                        <span className="text-[10px]">{downloadProgress}%</span>
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={handleShare} title="Share">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        )}
      </div>
      {next?.nextData && (
        <div className="mt-10 -mb-3 px-6 md:px-20 lg:px-32">
          <Next
            name={next.nextData.name}
            artist={next.nextData.artist}
            image={next.nextData.image}
            id={next.nextData.id}
          />
        </div>
      )}
    </div>
  );
}
