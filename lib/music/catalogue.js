/**
 * High-level catalogue service.
 *
 * All data comes from Apple's public iTunes Search API and Apple Music chart
 * feeds. Functions are defensive: a failed upstream request should degrade to
 * an empty list or a smaller page, never take the app down.
 */

import {
  chartAlbums,
  chartTracks,
  lookupRaw,
  normalizeAlbum,
  normalizeTrack,
  searchRaw,
} from "./itunes";
import { AFRICAN_SCENES } from "./genres";

export const DEFAULT_COUNTRY = process.env.MUSIC_COUNTRY || "US";

function dedupeById(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item || !item.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function byReleaseDateDesc(a, b) {
  return new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0);
}

export async function searchSongs(
  query,
  { limit = 24, country = DEFAULT_COUNTRY } = {},
) {
  try {
    const rows = await searchRaw({
      term: query,
      entity: "song",
      limit,
      country,
    });

    return rows
      .map(normalizeTrack)
      .filter((track) => track && track.previewUrl);
  } catch {
    return [];
  }
}

export async function searchAlbums(
  query,
  { limit = 20, country = DEFAULT_COUNTRY } = {},
) {
  try {
    const rows = await searchRaw({
      term: query,
      entity: "album",
      limit,
      country,
    });

    return rows.map(normalizeAlbum).filter(Boolean);
  } catch {
    return [];
  }
}

export async function getSongById(id) {
  try {
    const rows = await lookupRaw([id]);
    const row = rows.find(
      (item) => String(item.trackId) === String(id) && item.kind === "song",
    );
    return row ? normalizeTrack(row) : null;
  } catch {
    return null;
  }
}

export async function getAlbumById(id) {
  try {
    const rows = await lookupRaw([id]);
    const collection = rows.find(
      (item) =>
        String(item.collectionId) === String(id) &&
        (item.wrapperType === "collection" || item.collectionType),
    );

    const songs = dedupeById(
      rows
        .filter(
          (item) =>
            String(item.collectionId) === String(id) &&
            (item.kind === "song" || item.trackId),
        )
        .map(normalizeTrack)
        .filter(Boolean),
    );

    if (!collection && !songs.length) return null;

    const album = normalizeAlbum(
      collection || {
        collectionId: id,
        collectionName: songs[0]?.album?.name,
        artistName: songs[0]?.artists?.primary?.[0]?.name,
        artistId: songs[0]?.artists?.primary?.[0]?.id,
        artworkUrl100: songs[0]?.image?.[0]?.url,
        trackCount: songs.length,
        primaryGenreName: songs[0]?.genre,
        releaseDate: songs[0]?.releaseDate,
      },
    );

    if (!album) return null;
    return { ...album, songCount: album.songCount || songs.length, songs };
  } catch {
    return null;
  }
}

export async function getSuggestions(id, limit = 8) {
  const current = await getSongById(id);
  if (!current) return [];

  const artistName = current.artists.primary[0]?.name;
  const genre = current.genre;

  const [byArtist, byGenre] = await Promise.allSettled([
    artistName
      ? searchSongs(artistName, {
          limit: 20,
          country: current.country || DEFAULT_COUNTRY,
        })
      : Promise.resolve([]),
    genre
      ? searchSongs(genre, { limit: 20, country: DEFAULT_COUNTRY })
      : Promise.resolve([]),
  ]);

  const pool = dedupeById([
    ...(byArtist.status === "fulfilled" ? byArtist.value : []),
    ...(byGenre.status === "fulfilled" ? byGenre.value : []),
  ]).filter((track) => track.id !== String(id));

  return pool.slice(0, limit);
}

/** Run several catalogue searches in parallel and merge the playable results. */
export async function searchMany(plan, { limit = 20 } = {}) {
  const uniquePlan = [];
  const seen = new Set();
  for (const item of plan) {
    const key = `${item.term}:${item.country}`;
    if (!item.term || seen.has(key)) continue;
    seen.add(key);
    uniquePlan.push(item);
  }

  const results = await Promise.allSettled(
    uniquePlan.map((item) =>
      searchSongs(item.term, { limit, country: item.country }),
    ),
  );

  return dedupeById(
    results.flatMap((result) =>
      result.status === "fulfilled" ? result.value : [],
    ),
  );
}

function artistCardsFromTracks(tracks, { limit = 14, scene } = {}) {
  const map = new Map();

  for (const track of tracks) {
    const artist = track.artists?.primary?.[0];
    if (!artist?.id) continue;

    const existing = map.get(artist.id);
    if (existing) {
      existing.trackCount += 1;
      if (new Date(track.releaseDate) > new Date(existing.latestRelease)) {
        existing.latestRelease = track.releaseDate;
        existing.image = track.image?.[1]?.url || existing.image;
        existing.track = track;
      }
      continue;
    }

    map.set(artist.id, {
      id: artist.id,
      name: artist.name,
      image: track.image?.[1]?.url || artist.image?.[1]?.url,
      trackCount: 1,
      latestRelease: track.releaseDate,
      genre: track.genre,
      scene: scene || null,
      track,
    });
  }

  return [...map.values()]
    .sort((a, b) => new Date(b.latestRelease || 0) - new Date(a.latestRelease || 0))
    .slice(0, limit);
}

export async function getHome() {
  const [afrobeats, amapiano, chart, albumsChart, globalChart] =
    await Promise.allSettled([
      searchSongs("afrobeats", { limit: 18, country: "NG" }),
      searchSongs("amapiano", { limit: 14, country: "ZA" }),
      chartTracks({ country: "za", limit: 12 }),
      chartAlbums({ country: "ng", limit: 12 }),
      chartTracks({ country: "us", limit: 10 }),
    ]);

  const afrobeatsTracks = afrobeats.status === "fulfilled" ? afrobeats.value : [];
  const amapianoTracks = amapiano.status === "fulfilled" ? amapiano.value : [];
  const zaChart = chart.status === "fulfilled" ? chart.value : [];
  const ngAlbums = albumsChart.status === "fulfilled" ? albumsChart.value : [];
  const usChart = globalChart.status === "fulfilled" ? globalChart.value : [];

  const latest = dedupeById([...afrobeatsTracks, ...amapianoTracks])
    .sort(byReleaseDateDesc)
    .slice(0, 16);

  const trending = dedupeById([...zaChart, ...usChart]).slice(0, 14);

  const albums = ngAlbums.length
    ? ngAlbums.slice(0, 12)
    : await searchAlbums("afrobeats", { limit: 12, country: "NG" });

  const artists = artistCardsFromTracks([...latest, ...trending], { limit: 14 });

  return {
    latest,
    trending,
    albums,
    artists,
    africanSpotlight: afrobeatsTracks.slice(0, 10),
    meta: {
      source: "Apple Music catalogue",
      updatedAt: new Date().toISOString(),
    },
  };
}

export async function getAfricanDiscovery({ scene: requestedScene } = {}) {
  const selected =
    AFRICAN_SCENES.find((item) => item.id === requestedScene) || null;
  const scenes = selected ? [selected] : AFRICAN_SCENES;

  const [sceneResults, albumsResult] = await Promise.allSettled([
    Promise.allSettled(
      scenes.map((scene) =>
        searchSongs(scene.searchTerm, {
          limit: 14,
          country: scene.country,
        }).then((tracks) =>
          tracks.map((track) => ({
            ...track,
            scene: {
              id: scene.id,
              label: scene.label,
              country: scene.countryLabel,
            },
          })),
        ),
      ),
    ),
    chartAlbums({ country: "ng", limit: 10 }),
  ]);

  const tracks = dedupeById(
    sceneResults.status === "fulfilled"
      ? sceneResults.value.flatMap((result) =>
          result.status === "fulfilled" ? result.value : [],
        )
      : [],
  );

  const fresh = [...tracks].sort(byReleaseDateDesc).slice(0, 20);

  const artists = artistCardsFromTracks(tracks, { limit: 24 }).map((artist) => {
    const monthsOld = artist.latestRelease
      ? Math.max(
          0,
          (Date.now() - new Date(artist.latestRelease).getTime()) /
            (1000 * 60 * 60 * 24 * 30),
        )
      : 36;

    // Transparent heuristic: a recent release plus a light presence in the
    // sampled catalogue marks a "rising" pick. This is not a chart claim.
    const rising = monthsOld <= 18 && artist.trackCount <= 3;

    return {
      ...artist,
      rising,
      reason: artist.scene
        ? `${artist.scene.label} · ${artist.scene.country}`
        : artist.genre,
    };
  });

  const albums =
    albumsResult.status === "fulfilled" ? albumsResult.value.slice(0, 10) : [];

  return {
    scenes: AFRICAN_SCENES,
    selectedScene: selected?.id || "all",
    tracks,
    fresh,
    artists,
    albums,
    meta: {
      source: "Apple Music catalogue",
      method:
        "Genre-led live searches across Nigeria, South Africa, Ghana, Kenya and Tanzania. Rising is a recency/sample heuristic, not a chart ranking.",
    },
  };
}
