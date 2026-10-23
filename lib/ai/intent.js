/**
 * Natural-language music intent parsing.
 *
 * Two paths produce the same structured intent:
 *   1. A configured language model (see lib/ai/provider.js).
 *   2. A transparent lexicon/rule parser used when no model is configured.
 *
 * The rule path is never presented as model output. The API returns its
 * `source` so the UI can say exactly which path ran.
 */

import { GENRES, findGenre } from "@/lib/music/genres";

export const MOODS = [
  {
    id: "calm",
    label: "Calm",
    terms: ["calm", "relax", "relaxed", "chill", "unwind", "peaceful", "soft", "gentle", "mellow", "sleepy", "slow"],
    energy: 0.22,
    genres: ["acoustic", "lofi", "ambient", "soul"],
  },
  {
    id: "energetic",
    label: "Energetic",
    terms: ["energetic", "energy", "hype", "hyped", "pumped", "upbeat", "fast", "turn up", "active", "adrenaline", "lively"],
    energy: 0.85,
    genres: ["afrobeats", "dance", "afro-house", "hip-hop"],
  },
  {
    id: "confident",
    label: "Confident",
    terms: ["confident", "confidence", "boss", "swagger", "unstoppable", "bold", "fearless", "badass", "main character", "untouchable"],
    energy: 0.78,
    genres: ["afrobeats", "hip-hop", "pop"],
  },
  {
    id: "happy",
    label: "Happy",
    terms: ["happy", "joy", "joyful", "good vibes", "sunny", "smile", "celebrate", "celebration", "uplifting", "feel good", "feel-good"],
    energy: 0.7,
    genres: ["afrobeats", "pop", "dance"],
  },
  {
    id: "romantic",
    label: "Romantic",
    terms: ["romantic", "romance", "love", "date night", "intimate", "sensual", "cuddle", "valentine"],
    energy: 0.4,
    genres: ["rnb", "soul", "afrobeats"],
  },
  {
    id: "sad",
    label: "Melancholy",
    terms: ["sad", "heartbreak", "heartbroken", "melancholy", "cry", "lonely", "somber", "rainy", "grief"],
    energy: 0.25,
    genres: ["soul", "acoustic", "rnb"],
  },
  {
    id: "focused",
    label: "Focused",
    terms: ["focus", "focused", "study", "concentrate", "deep work", "productive", "coding", "flow state"],
    energy: 0.3,
    genres: ["lofi", "ambient", "jazz"],
  },
  {
    id: "nostalgic",
    label: "Nostalgic",
    terms: ["nostalgic", "nostalgia", "throwback", "old school", "memories", "remember"],
    energy: 0.55,
    genres: ["soul", "highlife", "rnb", "pop"],
  },
  {
    id: "spiritual",
    label: "Spiritual",
    terms: ["spiritual", "worship", "prayer", "devotion", "grateful", "faith", "meditative"],
    energy: 0.45,
    genres: ["gospel", "ambient", "soul"],
  },
  {
    id: "angry",
    label: "Intense",
    terms: ["angry", "intense", "rage", "aggressive", "hard", "dark", "brooding"],
    energy: 0.88,
    genres: ["hip-hop", "rock", "drill"],
  },
];

export const ACTIVITIES = [
  {
    id: "going-out",
    label: "getting ready to go out",
    terms: ["going out", "night out", "party", "club", "pre-drink", "getting ready", "dress up", "dance floor", "nightlife"],
    energy: 0.86,
    genres: ["afrobeats", "amapiano", "dance", "afro-house"],
  },
  {
    id: "workout",
    label: "a workout",
    terms: ["workout", "gym", "run", "running", "training", "exercise", "lifting", "cardio"],
    energy: 0.9,
    genres: ["hip-hop", "dance", "afrobeats"],
  },
  {
    id: "study",
    label: "studying",
    terms: ["study", "homework", "revision", "reading", "exam", "library"],
    energy: 0.28,
    genres: ["lofi", "ambient", "jazz"],
  },
  {
    id: "work",
    label: "focused work",
    terms: ["work", "office", "coding", "programming", "writing", "deadline", "building"],
    energy: 0.4,
    genres: ["lofi", "jazz", "ambient"],
  },
  {
    id: "commute",
    label: "the commute",
    terms: ["commute", "drive", "driving", "road trip", "traffic", "bus", "train", "travel"],
    energy: 0.65,
    genres: ["afrobeats", "pop", "rnb"],
  },
  {
    id: "cooking",
    label: "cooking",
    terms: ["cook", "cooking", "kitchen", "supper", "making food"],
    energy: 0.55,
    genres: ["soul", "jazz", "afrobeats"],
  },
  {
    id: "dinner",
    label: "a dinner",
    terms: ["dinner", "dinner party", "hosting", "guests", "date", "restaurant"],
    energy: 0.45,
    genres: ["jazz", "soul", "rnb"],
  },
  {
    id: "sleep",
    label: "winding down",
    terms: ["sleep", "bed", "wind down", "night", "insomnia", "rest"],
    energy: 0.12,
    genres: ["ambient", "acoustic", "lofi"],
  },
  {
    id: "worship",
    label: "worship",
    terms: ["worship", "prayer", "church", "sunday service", "devotion", "praise"],
    energy: 0.55,
    genres: ["gospel"],
  },
  {
    id: "gaming",
    label: "gaming",
    terms: ["gaming", "game", "console", "fortnite", "esports"],
    energy: 0.7,
    genres: ["hip-hop", "dance", "electronic"],
  },
];

const ENERGY_TERMS = [
  { energy: 0.15, terms: ["very low", "barely there", "sleepy", "ambient", "slow", "gentle", "soft"] },
  { energy: 0.25, terms: ["low energy", "low-energy", "calm", "chill", "mellow", "quiet"] },
  { energy: 0.5, terms: ["mid tempo", "mid-tempo", "medium", "steady", "balanced"] },
  { energy: 0.7, terms: ["upbeat", "bouncy", "lively", "warm"] },
  { energy: 0.85, terms: ["high energy", "high-energy", "energetic", "hype", "fast", "intense", "turn up"] },
  { energy: 0.95, terms: ["maximum energy", "peak", "euphoric", "frantic", "full throttle"] },
];

const STOP_WORDS = new Set(
  (
    "a an the and or but for to from with without in on at of my me i im i'm want need " +
    "give make put some please song songs music track tracks playlist play find something " +
    "that this these those it its it's be been is are was were do does like feel feeling " +
    "get getting ready go going out want would should could can will gonna wanna gotta let " +
    "current situation vibe vibes sound sounds listen listening right now very really just " +
    "also more less start starts beginning end ending slowly gradually become becomes build " +
    "builds building into through about new old any"
  ).split(/\s+/),
);

function normalise(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function hasTerm(text, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (/^[a-z0-9]+$/.test(term)) {
    return new RegExp(`\\b${escaped}\\b`, "i").test(text);
  }
  return text.includes(term);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function findMood(value) {
  const needle = normalise(value);
  return MOODS.find(
    (mood) => mood.id === needle || mood.label.toLowerCase() === needle,
  );
}

function findActivity(value) {
  const needle = normalise(value);
  return ACTIVITIES.find(
    (activity) =>
      activity.id === needle || activity.label.toLowerCase().includes(needle),
  );
}

function energyWord(energy) {
  if (energy >= 0.78) return "High-energy";
  if (energy >= 0.55) return "Up-tempo";
  if (energy >= 0.36) return "Mid-tempo";
  return "Low-key";
}

function detectEnergy(text) {
  for (const item of ENERGY_TERMS) {
    if (item.terms.some((term) => hasTerm(text, term))) return item.energy;
  }
  return null;
}

function extractSeedArtist(text) {
  const quoted = text.match(/["“]([^"”]{2,50})["”]/);
  if (quoted) return quoted[1].trim();

  const match = text.match(
    /(?:something like|sounds like|similar to|in the vein of|reminds me of|inspired by|(?:music|songs?|artists?|tracks?)\s+like)\s+([a-z0-9&' .\-]{2,48})/i,
  );
  if (!match) return "";

  return match[1]
    .split(/\b(?:but|that|with|for|who|which|and)\b|[,.;!?]/i)[0]
    .trim()
    .slice(0, 48);
}

function extractKeywords(text, consumedTerms) {
  const cleaned = text
    .replace(/[^a-z0-9\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();

  const words = cleaned.split(" ").filter((word) => {
    if (!word || word.length < 3) return false;
    if (STOP_WORDS.has(word)) return false;
    if (consumedTerms.some((term) => term.includes(word) || word.includes(term))) {
      return false;
    }
    return true;
  });

  return [...new Set(words)].slice(0, 8);
}

function pickGenres(text) {
  const found = [];

  // Longest terms first so "afro house" wins over "house".
  const sorted = [...GENRES].sort((a, b) => {
    const longestA = Math.max(...a.terms.map((term) => term.length));
    const longestB = Math.max(...b.terms.map((term) => term.length));
    return longestB - longestA;
  });

  for (const genre of sorted) {
    if (genre.terms.some((term) => hasTerm(text, term))) {
      found.push(genre);
    }
  }

  return found;
}

export function parseIntent(prompt) {
  const text = normalise(prompt);
  const genreEntries = pickGenres(text);

  const moodHits = MOODS.map((mood) => ({
    mood,
    hits: mood.terms.filter((term) => hasTerm(text, term)).length,
  }))
    .filter((item) => item.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 3)
    .map((item) => item.mood);

  const activityHits = ACTIVITIES.map((activity) => ({
    activity,
    hits: activity.terms.filter((term) => hasTerm(text, term)).length,
  }))
    .filter((item) => item.hits > 0)
    .sort((a, b) => b.hits - a.hits);

  const activity = activityHits[0]?.activity || null;
  const seedArtist = extractSeedArtist(text);

  const explicitEnergy = detectEnergy(text);
  const inferred = [
    ...moodHits.map((mood) => mood.energy),
    ...(activity ? [activity.energy] : []),
  ];
  const energy =
    explicitEnergy ??
    (inferred.length
      ? inferred.reduce((sum, value) => sum + value, 0) / inferred.length
      : 0.55);

  const consumed = [
    ...genreEntries.flatMap((genre) => genre.terms),
    ...moodHits.flatMap((mood) => mood.terms),
    ...(activity ? activity.terms : []),
  ];
  const keywords = extractKeywords(text, consumed);

  const genreLabels = genreEntries.map((genre) => genre.label);
  const moodLabels = moodHits.map((mood) => mood.label);

  const summaryParts = [
    `${energyWord(energy)} ${genreLabels.length ? genreLabels.join(" / ") : "mix"}`,
  ];
  if (activity) {
    summaryParts.push(`for ${activity.label}`);
  }
  if (moodLabels.length) {
    summaryParts.push(`— ${moodLabels.join(" and ").toLowerCase()}`);
  }
  if (seedArtist) {
    summaryParts.push(`, inspired by ${seedArtist}`);
  }

  return {
    prompt: String(prompt || ""),
    summary: `${summaryParts.join(" ")}.`,
    genreIds: genreEntries.map((genre) => genre.id),
    genreLabels,
    moodIds: moodHits.map((mood) => mood.id),
    moodLabels,
    activityId: activity?.id || null,
    activityLabel: activity?.label || null,
    energy: Math.round(clamp(energy, 0, 1) * 100) / 100,
    tempo: energy >= 0.75 ? "fast" : energy >= 0.45 ? "mid" : "slow",
    seedArtist,
    keywords,
    countries: [],
    avoid: [],
    source: "rules",
    model: null,
  };
}

/** Coerce a model response into the same validated shape as parseIntent. */
export function normalizeModelIntent(raw, prompt, model) {
  const fallback = parseIntent(prompt);
  if (!raw || typeof raw !== "object") return fallback;

  const genreIds = new Set();
  const genreLabels = [];
  for (const value of Array.isArray(raw.genres) ? raw.genres : []) {
    const genre = findGenre(value);
    if (genre && !genreIds.has(genre.id)) {
      genreIds.add(genre.id);
      genreLabels.push(genre.label);
    }
  }

  const moodIds = new Set();
  const moodLabels = [];
  for (const value of Array.isArray(raw.moods) ? raw.moods : []) {
    const mood = findMood(value);
    if (mood && !moodIds.has(mood.id)) {
      moodIds.add(mood.id);
      moodLabels.push(mood.label);
    }
  }

  const activity = findActivity(raw.activity) || findActivity(raw.activityId);
  const energyValue = Number(raw.energy);
  const energy = Number.isFinite(energyValue)
    ? clamp(energyValue, 0, 1)
    : fallback.energy;

  const keywords = Array.isArray(raw.keywords)
    ? raw.keywords
        .map((item) => String(item).toLowerCase().trim())
        .filter(Boolean)
        .slice(0, 8)
    : fallback.keywords;

  const summary =
    typeof raw.summary === "string" && raw.summary.trim()
      ? raw.summary.trim().slice(0, 240)
      : fallback.summary;

  return {
    prompt: String(prompt || ""),
    summary,
    genreIds: genreIds.size ? [...genreIds] : fallback.genreIds,
    genreLabels: genreLabels.length ? genreLabels : fallback.genreLabels,
    moodIds: moodIds.size ? [...moodIds] : fallback.moodIds,
    moodLabels: moodLabels.length ? moodLabels : fallback.moodLabels,
    activityId: activity?.id || fallback.activityId,
    activityLabel: activity?.label || fallback.activityLabel,
    energy,
    tempo: energy >= 0.75 ? "fast" : energy >= 0.45 ? "mid" : "slow",
    seedArtist:
      typeof raw.seedArtist === "string" && raw.seedArtist.trim()
        ? raw.seedArtist.trim().slice(0, 48)
        : fallback.seedArtist,
    keywords,
    countries: Array.isArray(raw.countries)
      ? raw.countries.map((item) => String(item).slice(0, 40)).slice(0, 4)
      : [],
    avoid: Array.isArray(raw.avoid)
      ? raw.avoid.map((item) => String(item).slice(0, 40)).slice(0, 4)
      : [],
    source: "model",
    model,
  };
}

/**
 * Turn an intent into catalogue searches. The plan mixes explicit genres with
 * mood/activity palettes, an optional "sounds like" artist, and free keywords.
 */
export function buildSearchPlan(intent) {
  const plan = [];
  const seen = new Set();

  function add(term, country, label) {
    const key = `${String(term).toLowerCase()}:${country}`;
    if (!term || seen.has(key) || plan.length >= 6) return;
    seen.add(key);
    plan.push({ term: String(term).slice(0, 60), country, label });
  }

  for (const id of intent.genreIds || []) {
    const genre = findGenre(id);
    if (genre) add(genre.searchTerm, genre.country, genre.label);
  }

  for (const id of intent.moodIds || []) {
    const mood = MOODS.find((item) => item.id === id);
    if (!mood) continue;
    for (const genreId of mood.genres.slice(0, 2)) {
      const genre = findGenre(genreId);
      if (genre) add(genre.searchTerm, genre.country, genre.label);
    }
  }

  const activity = ACTIVITIES.find((item) => item.id === intent.activityId);
  if (activity) {
    for (const genreId of activity.genres.slice(0, 2)) {
      const genre = findGenre(genreId);
      if (genre) add(genre.searchTerm, genre.country, genre.label);
    }
  }

  if (intent.seedArtist) {
    add(intent.seedArtist, process.env.MUSIC_COUNTRY || "US", `Like ${intent.seedArtist}`);
  }

  if (intent.keywords?.length && plan.length < 3) {
    add(intent.keywords.slice(0, 3).join(" "), process.env.MUSIC_COUNTRY || "US", "Keyword search");
  }

  if (!plan.length) {
    add("afrobeats", "NG", "Afrobeats");
    add("pop", "US", "Pop");
  }

  return plan;
}

export function describeIntentForModel() {
  return `Allowed genre ids: ${GENRES.map((genre) => genre.id).join(", ")}.
Allowed mood ids: ${MOODS.map((mood) => mood.id).join(", ")}.
Allowed activity ids: ${ACTIVITIES.map((activity) => activity.id).join(", ")}.`;
}
