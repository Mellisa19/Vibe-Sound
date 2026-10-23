"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { TasteContext } from "@/hooks/use-context";
import {
  TASTE_STORAGE_KEY,
  emptyProfile,
  getLikedTracks,
  getSavedTracks,
  readProfileFromStorage,
  recordEvent,
  tasteSummary,
  writeProfileToStorage,
} from "@/lib/personalization";

/**
 * Owns the on-device taste profile. Components call `record` for implicit
 * signals and `toggleLike` / `toggleSave` for explicit feedback. Every change
 * is persisted to localStorage and immediately reflected in the UI.
 */
export default function TasteProvider({ children }) {
  const [profile, setProfile] = useState(emptyProfile);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setProfile(readProfileFromStorage());
    setReady(true);

    const handleStorage = (event) => {
      if (event.key === TASTE_STORAGE_KEY) {
        setProfile(readProfileFromStorage());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const record = useCallback((type, track) => {
    if (!track?.id) return;
    setProfile((previous) => {
      const next = recordEvent(previous, track, type);
      writeProfileToStorage(next);
      return next;
    });
  }, []);

  const toggleLike = useCallback((track) => {
    if (!track?.id) return;
    setProfile((previous) => {
      const type = previous.liked?.[track.id] ? "unlike" : "like";
      const next = recordEvent(previous, track, type);
      writeProfileToStorage(next);
      return next;
    });
  }, []);

  const toggleSave = useCallback((track) => {
    if (!track?.id) return;
    setProfile((previous) => {
      const type = previous.saved?.[track.id] ? "unsave" : "save";
      const next = recordEvent(previous, track, type);
      writeProfileToStorage(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    const next = emptyProfile();
    writeProfileToStorage(next);
    setProfile(next);
  }, []);

  const value = useMemo(
    () => ({
      profile,
      ready,
      record,
      toggleLike,
      toggleSave,
      reset,
      isLiked: (id) => Boolean(profile.liked?.[id]),
      isSaved: (id) => Boolean(profile.saved?.[id]),
      likedTracks: getLikedTracks(profile),
      savedTracks: getSavedTracks(profile),
      summary: tasteSummary(profile),
    }),
    [profile, ready, record, toggleLike, toggleSave, reset],
  );

  return <TasteContext.Provider value={value}>{children}</TasteContext.Provider>;
}
