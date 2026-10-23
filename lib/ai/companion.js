/**
 * Recommendation services that sit between the AI intent layer and the live
 * catalogue.
 */

import { buildSearchPlan } from "@/lib/ai/intent";
import { interpretPrompt, publicAiStatus } from "@/lib/ai/provider";
import { searchMany, getHome } from "@/lib/music/catalogue";
import { findGenre } from "@/lib/music/genres";
import {
  topArtists,
  topGenres,
} from "@/lib/personalization";
import { rankTracks, tasteSignals, genreMatches } from "@/lib/recommend/rank";

export async function buildCompanionMix(prompt, { profile = null } = {}) {
  const { intent, aiStatus, notice, error } = await interpretPrompt(prompt);
  const plan = buildSearchPlan(intent);
  const rawPool = await searchMany(plan, { limit: 20 });

  // When the listener names a genre, keep the mix inside that genre whenever
  // the catalogue gives us enough coherent options.
  let pool = rawPool;
  if (intent.genreIds?.length) {
    const focused = rawPool.filter((track) =>
      intent.genreIds.some((genreId) => genreMatches(track, genreId)),
    );
    if (focused.length >= 6) pool = focused;
  }

  const tracks = rankTracks(pool, intent, profile, {
    limit: 12,
    diversity: 2,
  });

  return {
    prompt,
    intent,
    tracks,
    source: intent.source,
    aiStatus,
    notice: notice || null,
    error: error || null,
    meta: {
      catalogue: "Apple Music",
      candidates: pool.length,
      searches: plan.map((item) => item.term),
      preview: "30-second Apple Music previews",
    },
  };
}

export async function getForYouMix(profile) {
  const signals = tasteSignals(profile);
  const artists = topArtists(profile, 3);
  const genres = topGenres(profile, 3);

  // No feedback yet: reuse the already-warm home catalogue instead of making
  // three extra upstream searches. This keeps the starter mix fast.
  if (!signals.hasSignals) {
    const home = await getHome();
    const seen = new Set();
    const pool = [
      ...(home.latest || []),
      ...(home.trending || []),
      ...(home.africanSpotlight || []),
    ].filter((track) => {
      if (!track?.id || seen.has(track.id)) return false;
      seen.add(track.id);
      return true;
    });

    const starterIntent = {
      genreIds: ["afrobeats", "amapiano"],
      genreLabels: ["Afrobeats", "Amapiano"],
      moodIds: [],
      moodLabels: [],
      activityId: null,
      activityLabel: null,
      energy: 0.68,
      keywords: [],
      seedArtist: "",
      avoid: [],
    };

    const tracks = rankTracks(pool, starterIntent, profile, {
      limit: 16,
      diversity: 2,
    });

    return {
      tracks,
      personalised: false,
      signals,
      aiStatus: publicAiStatus(),
      summary:
        "No listening signals yet — this is a catalogue starter mix. Like, save, replay or skip tracks to shape it.",
      meta: {
        catalogue: "Apple Music",
        searches: ["catalogue charts", "Afrobeats", "Amapiano"],
        candidates: pool.length,
      },
    };
  }

  const plan = [];
  const seen = new Set();
  const add = (term, country, label) => {
    if (!term || seen.has(String(term).toLowerCase()) || plan.length >= 6) return;
    seen.add(String(term).toLowerCase());
    plan.push({ term, country, label });
  };

  for (const artist of artists) {
    add(artist.name, process.env.MUSIC_COUNTRY || "US", "Artist affinity");
  }

  for (const genre of genres) {
    const entry = findGenre(genre.name);
    if (entry) add(entry.searchTerm, entry.country, entry.label);
  }

  if (!plan.length) {
    add("afrobeats", "NG", "Afrobeats");
    add("amapiano", "ZA", "Amapiano");
    add("pop", "US", "Pop");
  }

  const pool = await searchMany(plan, { limit: 20 });

  let rankedPool = pool;
  const genreIds = genres
    .map((genre) => findGenre(genre.name)?.id)
    .filter(Boolean)
    .slice(0, 4);

  if (genreIds.length) {
    const focused = pool.filter((track) =>
      genreIds.some((genreId) => genreMatches(track, genreId)),
    );
    if (focused.length >= 8) rankedPool = focused;
  }

  const energyValues = genres
    .map((genre) => findGenre(genre.name)?.energy)
    .filter((value) => typeof value === "number");

  const intent = {
    genreIds,
    genreLabels: genres.map((genre) => genre.name),
    moodIds: [],
    moodLabels: [],
    activityId: null,
    activityLabel: null,
    energy: energyValues.length
      ? energyValues.reduce((sum, value) => sum + value, 0) / energyValues.length
      : 0.62,
    keywords: [],
    seedArtist: "",
    avoid: [],
  };

  const tracks = rankTracks(rankedPool, intent, profile, {
    limit: 16,
    diversity: 2,
  });

  return {
    tracks,
    personalised: Boolean(signals.hasSignals && tracks.length),
    signals,
    aiStatus: publicAiStatus(),
    summary: signals.hasSignals
      ? "Ranked with the feedback saved on this device, then matched against live catalogue metadata."
      : "No listening signals yet — this is a catalogue starter mix. Like, save, replay or skip tracks to shape it.",
    meta: {
      catalogue: "Apple Music",
      searches: plan.map((item) => item.term),
      candidates: pool.length,
    },
  };
}
