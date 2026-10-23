/**
 * Deterministic ranking for catalogue results.
 *
 * Scores combine: intent match (genre, energy, keywords, "sounds like"),
 * on-device taste, freshness, and explicit likes/saves. The AI model does not
 * invent recommendations — it only interprets the request; tracks always come
 * from the live catalogue and are ranked here.
 */

import { findGenre } from "@/lib/music/genres";
import { topArtists, topGenres } from "@/lib/personalization";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function trackEnergy(track) {
  const genre = findGenre(track.genre);
  if (genre) return genre.energy;

  const name = `${track.genre || ""}`.toLowerCase();
  if (/(dance|house|edm|afro|amapiano)/.test(name)) return 0.8;
  if (/(hip|rap|trap|drill)/.test(name)) return 0.78;
  if (/(soul|r&b|rnb)/.test(name)) return 0.45;
  if (/(acoustic|folk|ambient|classical)/.test(name)) return 0.25;
  return 0.55;
}

export function genreMatches(track, genreId) {
  const wanted = findGenre(genreId);
  const actual = findGenre(track.genre);
  if (!wanted) return false;
  if (actual && actual.id === wanted.id) return true;

  const label = `${track.genre || ""}`.toLowerCase();
  return wanted.terms.some((term) => label.includes(term));
}

function tasteScore(track, profile) {
  if (!profile) return { score: 0, liked: false, saved: false, artistScore: 0 };

  const artist = track.artists?.primary?.[0];
  const artistEntry = artist?.id ? profile.artists?.[artist.id] : null;
  const genreEntry = profile.genres?.[track.genre];
  const liked = Boolean(profile.liked?.[track.id]);
  const saved = Boolean(profile.saved?.[track.id]);

  let score = 0;
  if (artistEntry) score += clamp(artistEntry.score / 5, -1.5, 1.4);
  if (genreEntry) score += clamp(genreEntry.score / 8, -0.8, 0.8);
  if (liked) score += 1.6;
  if (saved) score += 1.3;
  if (artistEntry?.skips >= 2 && artistEntry.score < 0) score -= 0.6;

  return {
    score,
    liked,
    saved,
    artistScore: artistEntry?.score || 0,
  };
}

function freshnessScore(track) {
  if (!track.releaseDate) return 0;
  const months =
    (Date.now() - new Date(track.releaseDate).getTime()) /
    (1000 * 60 * 60 * 24 * 30);
  if (!Number.isFinite(months)) return 0;
  if (months < 0) return 0.2;
  if (months <= 6) return 0.25;
  if (months <= 18) return 0.12;
  if (months <= 48) return 0.04;
  return 0;
}

function keywordScore(track, keywords = []) {
  const haystack = `${track.name} ${track.album?.name || ""}`.toLowerCase();
  const hits = keywords.filter((word) => haystack.includes(String(word).toLowerCase()));
  return Math.min(0.6, hits.length * 0.2);
}

function moodLabel(intent) {
  if (intent.moodLabels?.length) return intent.moodLabels[0];
  if (intent.activityLabel) return intent.activityLabel;
  return null;
}

function describeMatch(track, intent) {
  const genre = findGenre(track.genre);
  const label = genre?.label || track.genre || "catalogue pick";
  const energy = trackEnergy(track);
  const word = energy >= 0.75 ? "high-energy" : energy >= 0.45 ? "mid-tempo" : "low-key";
  const mood = moodLabel(intent);
  return mood ? `${label} · ${word} · ${mood.toLowerCase()}` : `${label} · ${word}`;
}

export function rankTracks(
  tracks,
  intent,
  profile,
  { limit = 12, diversity = 2, excludeIds = new Set(), freshnessWeight = 1 } = {},
) {
  const genreIds = intent?.genreIds || [];
  const targetEnergy = clamp(Number(intent?.energy ?? 0.55), 0, 1);
  const seedArtist = (intent?.seedArtist || "").toLowerCase();
  const avoid = (intent?.avoid || []).map((item) => String(item).toLowerCase());

  const scored = [];

  for (const track of tracks || []) {
    if (!track?.id || excludeIds.has(track.id)) continue;

    const taste = tasteScore(track, profile);
    const energy = trackEnergy(track);
    const energyFit = 1 - Math.abs(energy - targetEnergy);

    let score = 0.3;
    score += energyFit * 1.35;

    const matched = genreIds.find((id) => genreMatches(track, id)) || null;
    if (matched) {
      const rank = genreIds.indexOf(matched);
      score += 1.35 - Math.min(Math.max(rank, 0), 3) * 0.12;
    }

    score += taste.score;

    const artistName = (track.artists?.primary?.[0]?.name || "").toLowerCase();
    if (seedArtist && artistName.includes(seedArtist)) score += 1.4;
    score += keywordScore(track, intent?.keywords || []);
    score += freshnessScore(track) * freshnessWeight;

    if (avoid.some((word) => `${track.name} ${artistName}`.toLowerCase().includes(word))) {
      score -= 2.2;
    }

    scored.push({
      ...track,
      matchScore: Math.round(score * 1000) / 1000,
      energy,
      matchedGenre: matched || findGenre(track.genre)?.id || null,
      reason: buildReason(track, {
        intent,
        taste,
        seedArtist,
        matchedGenre: matched,
      }),
    });
  }

  scored.sort((a, b) => b.matchScore - a.matchScore);

  const selected = [];
  const artistCounts = new Map();
  const seen = new Set();

  for (const track of scored) {
    if (selected.length >= limit) break;
    const artist = track.artists?.primary?.[0]?.id || "unknown";
    const count = artistCounts.get(artist) || 0;
    if (count >= diversity) continue;
    artistCounts.set(artist, count + 1);
    seen.add(track.id);
    selected.push(track);
  }

  if (selected.length < limit) {
    for (const track of scored) {
      if (selected.length >= limit) break;
      if (seen.has(track.id)) continue;
      selected.push(track);
      seen.add(track.id);
    }
  }

  return selected;
}

function buildReason(track, { taste, seedArtist, matchedGenre }) {
  if (taste.liked) return "Liked on this device";
  if (taste.saved) return "Saved on this device";
  if (taste.artistScore > 2) {
    return `Because you play ${track.artists?.primary?.[0]?.name || "this artist"}`;
  }
  if (seedArtist && (track.artists?.primary?.[0]?.name || "").toLowerCase().includes(seedArtist)) {
    return `Close to ${track.artists.primary[0].name}`;
  }
  if (matchedGenre) {
    return describeMatch(track, { genreLabels: [matchedGenre], moodLabels: [] });
  }
  return describeMatch(track, {});
}

/**
 * Build a transparent explanation of how a mix was personalised.
 */
export function tasteSignals(profile) {
  const artists = topArtists(profile, 3);
  const genres = topGenres(profile, 3);
  const liked = Object.keys(profile?.liked || {}).length;
  const saved = Object.keys(profile?.saved || {}).length;

  return {
    artists: artists.map((artist) => artist.name),
    genres: genres.map((genre) => genre.name),
    liked,
    saved,
    hasSignals: Boolean(artists.length || genres.length || liked || saved),
  };
}
