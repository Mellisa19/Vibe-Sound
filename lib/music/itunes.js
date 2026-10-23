/**
 * Apple Music / iTunes catalogue adapter.
 *
 * Apple's public Search API and marketing chart feeds require no key. They
 * return real artist, release, genre, artwork and 30-second preview metadata.
 * We normalise that data to the same shape the original MusicHub components
 * already understand, so the existing cards and player keep working.
 */

import { cached } from "./cache";

const SEARCH_BASE = "https://itunes.apple.com";
const CHART_BASE = "https://rss.applemarketingtools.com/api/v2";
const REVALIDATE_SECONDS = 1800;
const CACHE_TTL_MS = 30 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 6000;
const USER_AGENT = "VibeSoundAI/1.0 (educational music discovery project)";

function musicCountry(fallback = "US") {
  return process.env.MUSIC_COUNTRY || fallback;
}

function upscaleArtwork(url, size) {
  if (!url) return null;
  return url.replace(/\d+x\d+bb/, `${size}x${size}bb`);
}

export function artworkSet(url) {
  return [100, 300, 600].map((size) => ({
    url: upscaleArtwork(url, size),
    width: size,
    height: size,
  }));
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url, {
      headers: {
        accept: "application/json",
        "user-agent": USER_AGENT,
      },
      signal: controller.signal,
      next: { revalidate: REVALIDATE_SECONDS },
    });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new Error(`Apple catalogue request failed (${response.status})`);
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Apple catalogue returned an unexpected response");
  }
}

export async function searchRaw({
  term,
  country = musicCountry(),
  entity = "song",
  limit = 25,
}) {
  const cleanTerm = String(term || "").trim();
  if (!cleanTerm) return [];

  const safeLimit = Math.max(1, Math.min(Number(limit) || 25, 50));
  const url =
    `${SEARCH_BASE}/search?term=${encodeURIComponent(cleanTerm)}` +
    `&media=music&entity=${encodeURIComponent(entity)}` +
    `&limit=${safeLimit}&country=${encodeURIComponent(country)}`;

  return cached(`search:${entity}:${country}:${safeLimit}:${cleanTerm.toLowerCase()}`, CACHE_TTL_MS, async () => {
    const data = await fetchJson(url);
    return Array.isArray(data.results) ? data.results : [];
  });
}

export async function lookupRaw(ids, country = musicCountry()) {
  const list = (Array.isArray(ids) ? ids : [ids])
    .map((id) => String(id || "").trim())
    .filter(Boolean)
    .slice(0, 100);

  if (!list.length) return [];

  const url =
    `${SEARCH_BASE}/lookup?id=${encodeURIComponent(list.join(","))}` +
    `&entity=song&country=${encodeURIComponent(country)}`;

  return cached(`lookup:${country}:${list.join(",")}`, CACHE_TTL_MS, async () => {
    const data = await fetchJson(url);
    return Array.isArray(data.results) ? data.results : [];
  });
}

export async function chartRaw({ country = "za", kind = "songs", limit = 20 }) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 50));
  const url = `${CHART_BASE}/${encodeURIComponent(country)}/music/most-played/${safeLimit}/${kind}.json`;

  return cached(`chart:${country}:${kind}:${safeLimit}`, CACHE_TTL_MS, async () => {
    try {
      const data = await fetchJson(url);
      return Array.isArray(data?.feed?.results) ? data.feed.results : [];
    } catch {
      // Some country/feed combinations are occasionally unavailable.
      return [];
    }
  });
}

function normalisedArtist(entry) {
  return {
    id: String(entry.artistId || entry.artistName || "unknown"),
    name: entry.artistName || "Unknown artist",
    image: artworkSet(entry.artworkUrl100),
    url: entry.artistViewUrl || null,
  };
}

export function normalizeTrack(entry) {
  if (!entry || !entry.trackId) return null;

  const previewUrl = entry.previewUrl || null;
  const images = artworkSet(entry.artworkUrl100);

  return {
    id: String(entry.trackId),
    name: entry.trackName || "Untitled",
    album: {
      id: String(entry.collectionId || ""),
      name: entry.collectionName || "Single",
    },
    artists: {
      primary: [normalisedArtist(entry)],
    },
    image: images,
    downloadUrl: previewUrl
      ? [{ url: previewUrl, quality: "30-second preview" }]
      : [],
    duration: entry.trackTimeMillis
      ? Math.round(entry.trackTimeMillis / 1000)
      : 0,
    language: entry.primaryGenreName || "Music",
    genre: entry.primaryGenreName || "Music",
    releaseDate: entry.releaseDate || null,
    explicit:
      entry.trackExplicitness === "explicit" ||
      entry.collectionExplicitness === "explicit",
    url: entry.trackViewUrl || null,
    previewUrl,
    source: "Apple Music",
    isPreview: true,
  };
}

export function normalizeAlbum(entry) {
  if (!entry || !entry.collectionId) return null;

  const artist = normalisedArtist(entry);
  const year = entry.releaseDate
    ? new Date(entry.releaseDate).getFullYear()
    : null;

  return {
    id: String(entry.collectionId),
    name: entry.collectionName || "Untitled album",
    artists: { primary: [artist] },
    image: artworkSet(entry.artworkUrl100),
    songCount: entry.trackCount || null,
    releaseDate: entry.releaseDate || null,
    language: entry.primaryGenreName || "Music",
    genre: entry.primaryGenreName || "Music",
    description: [artist.name, year].filter(Boolean).join(" · "),
    url: entry.collectionViewUrl || null,
    source: "Apple Music",
  };
}

export async function chartTracks({ country, limit = 12 }) {
  const rows = await chartRaw({ country, kind: "songs", limit });
  if (!rows.length) return [];

  const ids = rows.map((row) => row.id).filter(Boolean);
  const details = await lookupRaw(ids, country);

  const byId = new Map();
  for (const item of details) {
    if (item?.kind === "song" || item?.trackId) {
      byId.set(String(item.trackId), item);
    }
  }

  return rows
    .map((row) => {
      const full = byId.get(String(row.id));
      if (full) return normalizeTrack(full);

      // Chart item without a hydrated preview: still real metadata, but it
      // cannot be played. Keep it out of playable lists.
      return null;
    })
    .filter(Boolean);
}

export async function chartAlbums({ country, limit = 12 }) {
  const rows = await chartRaw({ country, kind: "albums", limit });
  return rows
    .map((row) =>
      normalizeAlbum({
        collectionId: row.id,
        collectionName: row.name,
        artistName: row.artistName,
        artistId: row.artistId,
        artworkUrl100: row.artworkUrl100,
        releaseDate: row.releaseDate,
        primaryGenreName: row.genres?.[0]?.name,
        collectionViewUrl: row.url,
      }),
    )
    .filter(Boolean);
}
