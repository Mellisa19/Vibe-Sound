"use client";
import { MusicContext } from "@/hooks/use-context";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function MusicProvider({ children }) {
  const [music, setMusicState] = useState(null);
  const [current, setCurrent] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);

  useEffect(() => {
    if (localStorage.getItem("last-played")) {
      setMusicState(localStorage.getItem("last-played"));
    }
  }, []);

  const setMusic = useCallback((id) => {
    setMusicState(id);
    if (id) {
      localStorage.setItem("last-played", id);
    }
  }, []);

  const startQueue = useCallback((tracks, index = 0) => {
    const playable = (tracks || []).filter((track) => track?.id);
    if (!playable.length) return;

    const safeIndex = Math.max(0, Math.min(index, playable.length - 1));
    setQueue(playable);
    setQueueIndex(safeIndex);
    setMusicState(playable[safeIndex].id);
    localStorage.setItem("last-played", playable[safeIndex].id);
    localStorage.setItem("p", "true");
    setCurrent(0);
  }, []);

  const playQueueIndex = useCallback(
    (index) => {
      if (!queue.length) return;
      const safeIndex = Math.max(0, Math.min(index, queue.length - 1));
      setQueueIndex(safeIndex);
      setMusicState(queue[safeIndex].id);
      localStorage.setItem("last-played", queue[safeIndex].id);
      localStorage.setItem("p", "true");
      setCurrent(0);
    },
    [queue],
  );

  const nextTrack = useCallback(() => {
    if (!queue.length || queueIndex >= queue.length - 1) return;
    playQueueIndex(queueIndex + 1);
  }, [queue, queueIndex, playQueueIndex]);

  const previousTrack = useCallback(() => {
    if (!queue.length || queueIndex <= 0) return;
    playQueueIndex(queueIndex - 1);
  }, [queue, queueIndex, playQueueIndex]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setQueueIndex(0);
  }, []);

  const value = useMemo(
    () => ({
      music,
      setMusic,
      current,
      setCurrent,
      downloadProgress,
      setDownloadProgress,
      queue,
      queueIndex,
      hasNext: queueIndex < queue.length - 1,
      hasPrevious: queueIndex > 0,
      startQueue,
      playQueueIndex,
      nextTrack,
      previousTrack,
      clearQueue,
    }),
    [
      music,
      setMusic,
      current,
      downloadProgress,
      queue,
      queueIndex,
      startQueue,
      playQueueIndex,
      nextTrack,
      previousTrack,
      clearQueue,
    ],
  );

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}
