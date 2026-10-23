/**
 * On-device taste profile.
 *
 * VibeSound AI learns from explicit feedback (like / save) and implicit
 * signals (play / skip / replay / completion). Everything lives in the
 * browser's localStorage — no account, no server-side tracking. The profile is
 * sent to the recommendation endpoint only to rank catalogue results for that
 * request; it is not persisted on the server.
 */

export const TASTE_STORAGE_KEY = "vibesound:taste:v1";
export const TASTE_EVENT = "vibesound:taste-updated";

const EVENT_WEIGHTS = {
  play: 0.4,
  skip: -1.4,
  replay: 1.3,
  complete: 0.9,
  like: 2.6,
  unlike: -2.6,
  save: 2.1,
  unsave: -2.1,
};

const TRACK_SNAPSHOT_FIELDS = [
  "id",
  "name",
  "genre",
  "releaseDate",
  "duration",
  "previewUrl",
  "url",
];

export function emptyProfile() {
  return {
    version: 1,
    artists: {},
    genres: {},
    liked: {},
    saved: {},
    events: 0,
    updatedAt: null,
  };
}

function clampScore(value) {
  return Math.max(-40, Math.min(60, value));
}

function artistOf(track) {
  return track?.artists?.primary?.[0] || null;
}

function snapshotTrack(track) {
  if (!track) return null;

  const copy = {};
  for (const field of TRACK_SNAPSHOT_FIELDS) {
    copy[field] = track[field] ?? null;
  }
  copy.image = track.image || [];
  copy.album = track.album || null;
  copy.artists = track.artists || { primary: [] };
  copy.downloadUrl = track.downloadUrl || [];
  copy.isPreview = Boolean(track.isPreview);
  copy.source = track.source || "Apple Music";
  return copy;
}

function bump(bucket, key, patch) {
  const current = bucket[key] || {
    name: "",
    score: 0,
    plays: 0,
    skips: 0,
    replays: 0,
    likes: 0,
    saves: 0,
    lastAt: null,
  };

  bucket[key] = {
    ...current,
    ...patch,
    score: clampScore(current.score + (patch.delta || 0)),
    plays: current.plays + (patch.playDelta || 0),
    skips: current.skips + (patch.skipDelta || 0),
    replays: current.replays + (patch.replayDelta || 0),
    likes: current.likes + (patch.likeDelta || 0),
    saves: current.saves + (patch.saveDelta || 0),
    lastAt: new Date().toISOString(),
  };

  delete bucket[key].delta;
  delete bucket[key].playDelta;
  delete bucket[key].skipDelta;
  delete bucket[key].replayDelta;
  delete bucket[key].likeDelta;
  delete bucket[key].saveDelta;
}

export function recordEvent(profile, track, type) {
  const base = profile && typeof profile === "object" ? profile : emptyProfile();
  if (!track?.id || !(type in EVENT_WEIGHTS)) return base;

  const next = {
    version: 1,
    artists: { ...(base.artists || {}) },
    genres: { ...(base.genres || {}) },
    liked: { ...(base.liked || {}) },
    saved: { ...(base.saved || {}) },
    events: (base.events || 0) + 1,
    updatedAt: new Date().toISOString(),
  };

  const weight = EVENT_WEIGHTS[type];
  const artist = artistOf(track);
  const artistKey = artist?.id || artist?.name;
  const genreKey = track.genre || "Music";

  const artistPatch = { name: artist?.name || "", delta: weight };
  const genrePatch = { name: genreKey, delta: weight * 0.55 };

  if (type === "play") {
    artistPatch.playDelta = 1;
    genrePatch.playDelta = 1;
  } else if (type === "skip") {
    artistPatch.skipDelta = 1;
    genrePatch.skipDelta = 1;
  } else if (type === "replay") {
    artistPatch.replayDelta = 1;
    genrePatch.replayDelta = 1;
  } else if (type === "like") {
    artistPatch.likeDelta = 1;
    artistPatch.playDelta = 1;
    genrePatch.likeDelta = 1;
    next.liked[track.id] = snapshotTrack(track);
  } else if (type === "unlike") {
    artistPatch.likeDelta = -1;
    delete next.liked[track.id];
  } else if (type === "save") {
    artistPatch.saveDelta = 1;
    genrePatch.saveDelta = 1;
    next.saved[track.id] = snapshotTrack(track);
  } else if (type === "unsave") {
    artistPatch.saveDelta = -1;
    delete next.saved[track.id];
  }

  if (artistKey) bump(next.artists, artistKey, artistPatch);
  if (genreKey) bump(next.genres, genreKey, genrePatch);

  return next;
}

export function topArtists(profile, limit = 5) {
  return Object.entries(profile?.artists || {})
    .map(([id, value]) => ({ id, ...value }))
    .filter((artist) => artist.name)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function topGenres(profile, limit = 5) {
  return Object.entries(profile?.genres || {})
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function tasteSummary(profile) {
  const artists = topArtists(profile, 3);
  const genres = topGenres(profile, 3);
  const likedCount = Object.keys(profile?.liked || {}).length;
  const savedCount = Object.keys(profile?.saved || {}).length;
  const events = profile?.events || 0;

  return {
    artists,
    genres,
    likedCount,
    savedCount,
    events,
    hasSignals: events > 0,
    headline: events
      ? `${events} feedback signal${events === 1 ? "" : "s"} on this device`
      : "No listening signals yet",
  };
}

export function getLikedTracks(profile) {
  return Object.values(profile?.liked || {}).filter(Boolean);
}

export function getSavedTracks(profile) {
  return Object.values(profile?.saved || {}).filter(Boolean);
}

/**
 * Server-safe profile validation. Never trust a client-supplied profile: cap
 * keys and coerce scores to bounded numbers before ranking with it.
 */
export function sanitizeProfile(input) {
  const profile = emptyProfile();
  if (!input || typeof input !== "object") return profile;

  const readBucket = (source, limit) => {
    const result = {};
    let count = 0;
    for (const [key, value] of Object.entries(source || {})) {
      if (count >= limit) break;
      if (!key || !value || typeof value !== "object") continue;
      result[String(key).slice(0, 80)] = {
        name: String(value.name || "").slice(0, 120),
        score: Math.max(-40, Math.min(60, Number(value.score) || 0)),
        plays: Math.max(0, Math.min(10000, Number(value.plays) || 0)),
        skips: Math.max(0, Math.min(10000, Number(value.skips) || 0)),
        replays: Math.max(0, Math.min(10000, Number(value.replays) || 0)),
        likes: Math.max(0, Math.min(10000, Number(value.likes) || 0)),
        saves: Math.max(0, Math.min(10000, Number(value.saves) || 0)),
        lastAt: value.lastAt ? String(value.lastAt).slice(0, 40) : null,
      };
      count += 1;
    }
    return result;
  };

  profile.artists = readBucket(input.artists, 100);
  profile.genres = readBucket(input.genres, 60);

  for (const [key, value] of Object.entries(input.liked || {}).slice(0, 200)) {
    if (key && value) profile.liked[String(key).slice(0, 80)] = value;
  }
  for (const [key, value] of Object.entries(input.saved || {}).slice(0, 200)) {
    if (key && value) profile.saved[String(key).slice(0, 80)] = value;
  }

  profile.events = Math.max(0, Math.min(100000, Number(input.events) || 0));
  profile.updatedAt = input.updatedAt ? String(input.updatedAt).slice(0, 40) : null;
  return profile;
}

export function readProfileFromStorage() {
  if (typeof window === "undefined") return emptyProfile();
  try {
    const raw = window.localStorage.getItem(TASTE_STORAGE_KEY);
    if (!raw) return emptyProfile();
    return sanitizeProfile(JSON.parse(raw));
  } catch {
    return emptyProfile();
  }
}

export function writeProfileToStorage(profile) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TASTE_STORAGE_KEY, JSON.stringify(profile));
    window.dispatchEvent(new CustomEvent(TASTE_EVENT));
  } catch {
    // Storage can be blocked in private browsing; the in-memory state still works.
  }
}
