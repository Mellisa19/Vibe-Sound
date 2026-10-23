/**
 * Editorial genre taxonomy used by the AI intent parser and recommender.
 *
 * These are search strategies and energy priors for the live catalogue — not
 * invented songs or artists. Every recommendation still comes from Apple's
 * real metadata. `energy` is a rough 0–1 prior used only to order a mix.
 */

export const GENRES = [
  {
    id: "afrobeats",
    label: "Afrobeats",
    terms: ["afrobeats", "afrobeat", "afro-beat", "afro beats", "afro pop", "afropop"],
    searchTerm: "afrobeats",
    country: "NG",
    energy: 0.8,
  },
  {
    id: "amapiano",
    label: "Amapiano",
    terms: ["amapiano", "piano", "amapiano log drum"],
    searchTerm: "amapiano",
    country: "ZA",
    energy: 0.72,
  },
  {
    id: "alte",
    label: "Alté",
    terms: ["alte", "alté", "afro alternative", "alt afro"],
    searchTerm: "alté",
    country: "NG",
    energy: 0.45,
  },
  {
    id: "highlife",
    label: "Highlife",
    terms: ["highlife", "high life"],
    searchTerm: "highlife",
    country: "GH",
    energy: 0.6,
  },
  {
    id: "afro-house",
    label: "Afro House",
    terms: ["afro house", "afro-house", "afrohouse", "afro tech"],
    searchTerm: "afro house",
    country: "ZA",
    energy: 0.84,
  },
  {
    id: "gengetone",
    label: "Gengetone",
    terms: ["gengetone", "genge", "kenyan hip hop"],
    searchTerm: "gengetone",
    country: "KE",
    energy: 0.82,
  },
  {
    id: "bongo-flava",
    label: "Bongo Flava",
    terms: ["bongo flava", "bongo", "tanzanian"],
    searchTerm: "bongo flava",
    country: "TZ",
    energy: 0.62,
  },
  {
    id: "gospel",
    label: "Gospel",
    terms: ["gospel", "worship", "church", "spiritual", "christian"],
    searchTerm: "gospel",
    country: "US",
    energy: 0.55,
  },
  {
    id: "rnb",
    label: "R&B",
    terms: ["r&b", "rnb", "r and b", "rhythm and blues", "slow jam", "quiet storm"],
    searchTerm: "rnb",
    country: "US",
    energy: 0.48,
  },
  {
    id: "hip-hop",
    label: "Hip-Hop",
    terms: ["hip hop", "hip-hop", "hiphop", "rap", "drill", "trap", "bars"],
    searchTerm: "hip hop",
    country: "US",
    energy: 0.78,
  },
  {
    id: "pop",
    label: "Pop",
    terms: ["pop", "mainstream", "chart", "top 40"],
    searchTerm: "pop",
    country: "US",
    energy: 0.67,
  },
  {
    id: "soul",
    label: "Soul",
    terms: ["soul", "neo soul", "neo-soul", "motown"],
    searchTerm: "neo soul",
    country: "US",
    energy: 0.44,
  },
  {
    id: "jazz",
    label: "Jazz",
    terms: ["jazz", "bossa", "swing"],
    searchTerm: "jazz",
    country: "US",
    energy: 0.38,
  },
  {
    id: "acoustic",
    label: "Acoustic",
    terms: ["acoustic", "unplugged", "folk", "singer songwriter", "singer-songwriter"],
    searchTerm: "acoustic",
    country: "US",
    energy: 0.26,
  },
  {
    id: "lofi",
    label: "Lo-fi",
    terms: ["lofi", "lo-fi", "chillhop", "chill beats", "study beats"],
    searchTerm: "lofi",
    country: "US",
    energy: 0.24,
  },
  {
    id: "ambient",
    label: "Ambient",
    terms: ["ambient", "meditation", "sleep", "drone", "instrumental calm"],
    searchTerm: "ambient",
    country: "US",
    energy: 0.12,
  },
  {
    id: "dance",
    label: "Dance",
    terms: ["dance", "edm", "electronic", "house", "techno", "club", "rave"],
    searchTerm: "dance",
    country: "US",
    energy: 0.85,
  },
  {
    id: "reggae",
    label: "Reggae",
    terms: ["reggae", "dancehall", "dub", "caribbean"],
    searchTerm: "reggae",
    country: "JM",
    energy: 0.55,
  },
  {
    id: "rock",
    label: "Rock",
    terms: ["rock", "indie rock", "alternative", "punk", "guitar"],
    searchTerm: "rock",
    country: "US",
    energy: 0.72,
  },
  {
    id: "country",
    label: "Country",
    terms: ["country", "americana", "bluegrass"],
    searchTerm: "country",
    country: "US",
    energy: 0.46,
  },
  {
    id: "classical",
    label: "Classical",
    terms: ["classical", "piano", "orchestra", "baroque", "opera"],
    searchTerm: "classical",
    country: "US",
    energy: 0.2,
  },
  {
    id: "latin",
    label: "Latin",
    terms: ["latin", "reggaeton", "salsa", "bachata", "cumbia"],
    searchTerm: "latin",
    country: "US",
    energy: 0.76,
  },
  {
    id: "kpop",
    label: "K-Pop",
    terms: ["k-pop", "kpop", "korean pop"],
    searchTerm: "kpop",
    country: "US",
    energy: 0.7,
  },
];

export const AFRICAN_SCENES = [
  { id: "afrobeats", label: "Afrobeats", searchTerm: "afrobeats", country: "NG", countryLabel: "Nigeria" },
  { id: "amapiano", label: "Amapiano", searchTerm: "amapiano", country: "ZA", countryLabel: "South Africa" },
  { id: "alte", label: "Alté", searchTerm: "alté", country: "NG", countryLabel: "Nigeria" },
  { id: "highlife", label: "Highlife", searchTerm: "highlife", country: "GH", countryLabel: "Ghana" },
  { id: "gengetone", label: "Gengetone", searchTerm: "gengetone", country: "KE", countryLabel: "Kenya" },
  { id: "bongo-flava", label: "Bongo Flava", searchTerm: "bongo flava", country: "TZ", countryLabel: "Tanzania" },
];

export function findGenre(value) {
  const needle = String(value || "").toLowerCase().trim();
  if (!needle) return null;

  return (
    GENRES.find((genre) => genre.id === needle || genre.label.toLowerCase() === needle) ||
    GENRES.find((genre) =>
      genre.terms.some((term) => needle.includes(term) || term.includes(needle)),
    ) ||
    null
  );
}

export function energyOfGenre(value) {
  const genre = findGenre(value);
  return genre ? genre.energy : 0.55;
}

export function genreSearchPlan(genreIds = [], fallback = ["afrobeats", "pop"]) {
  const unique = [...new Set([...genreIds, ...fallback])].slice(0, 5);
  const plan = unique
    .map((id) => findGenre(id))
    .filter(Boolean)
    .map((genre) => ({
      term: genre.searchTerm,
      country: genre.country,
      label: genre.label,
    }));

  return plan.length
    ? plan
    : [{ term: "afrobeats", country: "NG", label: "Afrobeats" }];
}
