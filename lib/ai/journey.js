/**
 * AI Playlist Journey.
 *
 * A request like "start calm and gradually build to energetic Afrobeats" is
 * turned into 4–6 energy stages. Each stage is filled from live catalogue
 * searches and ranked against that stage's target energy. The result is a real
 * ordered queue — not a static mock playlist.
 */

import { askJourneyPlan, publicAiStatus } from "./provider";
import { MOODS, buildSearchPlan } from "./intent";
import { GENRES, findGenre } from "@/lib/music/genres";
import { searchMany } from "@/lib/music/catalogue";
import { rankTracks, genreMatches } from "@/lib/recommend/rank";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalise(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function moodMatches(text) {
  return MOODS.map((mood) => {
    const index = mood.terms
      .map((term) => text.indexOf(term))
      .filter((position) => position >= 0)
      .sort((a, b) => a - b)[0];
    return index === undefined ? null : { mood, index };
  })
    .filter(Boolean)
    .sort((a, b) => a.index - b.index);
}

function labelForEnergy(energy) {
  if (energy <= 0.2) return "Unwind";
  if (energy <= 0.35) return "Settle in";
  if (energy <= 0.5) return "Find the groove";
  if (energy <= 0.65) return "Lift off";
  if (energy <= 0.8) return "Peak";
  return "Euphoria";
}

function genresForEnergy(energy) {
  if (energy <= 0.22) return ["acoustic", "rnb"];
  if (energy <= 0.38) return ["soul", "highlife"];
  if (energy <= 0.52) return ["rnb", "afrobeats"];
  if (energy <= 0.68) return ["afrobeats", "amapiano"];
  if (energy <= 0.82) return ["afrobeats", "afro-house"];
  return ["dance", "afro-house"];
}

export function parseJourneyBrief(prompt) {
  const text = normalise(prompt);
  const hits = moodMatches(text);

  let startMood = hits[0]?.mood || null;
  let endMood = hits.length > 1 ? hits[hits.length - 1].mood : null;

  const fromTo = text.match(/\bfrom\s+(.{2,40}?)\s+to\s+(.{2,40})(?:[.,]|$)/i);
  if (fromTo) {
    const startText = normalise(fromTo[1]);
    const endText = normalise(fromTo[2]);
    startMood =
      MOODS.find((mood) => mood.terms.some((term) => startText.includes(term))) ||
      startMood;
    endMood =
      MOODS.find((mood) => mood.terms.some((term) => endText.includes(term))) ||
      endMood;
  }

  let startEnergy = startMood?.energy ?? null;
  let endEnergy = endMood?.energy ?? null;

  const explicitNumbers = text.match(
    /\b(?:from|between)\s+(\d{1,2})\s*(?:%|percent)?\s*(?:to|-)\s*(\d{1,2})\s*(?:%|percent)?/,
  );
  if (explicitNumbers) {
    startEnergy = clamp(Number(explicitNumbers[1]) / 100, 0, 1);
    endEnergy = clamp(Number(explicitNumbers[2]) / 100, 0, 1);
  }

  if (startEnergy === null && endEnergy !== null) {
    startEnergy = endEnergy > 0.5 ? 0.22 : 0.82;
  }
  if (endEnergy === null && startEnergy !== null) {
    endEnergy = startEnergy < 0.5 ? 0.86 : 0.2;
  }
  if (startEnergy === null && endEnergy === null) {
    startEnergy = 0.2;
    endEnergy = 0.86;
  }

  const explicitGenres = [];
  for (const genre of GENRES) {
    if (genre.terms.some((term) => text.includes(term))) explicitGenres.push(genre.id);
  }

  const direction =
    endEnergy > startEnergy + 0.08
      ? "build"
      : endEnergy < startEnergy - 0.08
        ? "descend"
        : "steady";

  const startLabel = startMood?.label || labelForEnergy(startEnergy);
  const endLabel = endMood?.label || labelForEnergy(endEnergy);

  return {
    prompt: String(prompt || ""),
    startEnergy,
    endEnergy,
    direction,
    startLabel,
    endLabel,
    explicitGenres: [...new Set(explicitGenres)],
    title:
      direction === "build"
        ? `${startLabel} to ${endLabel}`
        : direction === "descend"
          ? `${startLabel} down to ${endLabel}`
          : `${startLabel} all the way`,
    summary: `A ${direction === "steady" ? "steady" : direction === "build" ? "building" : "winding-down"} arc from ${startLabel.toLowerCase()} to ${endLabel.toLowerCase()}.`,
  };
}

function ruleStages(brief) {
  const count = 5;
  const stages = [];

  for (let index = 0; index < count; index += 1) {
    const ratio = count === 1 ? 0 : index / (count - 1);
    const energy =
      Math.round(
        (brief.startEnergy + (brief.endEnergy - brief.startEnergy) * ratio) * 100,
      ) / 100;
    const genres = [...new Set(genresForEnergy(energy))].slice(0, 3);

    stages.push({
      label: labelForEnergy(energy),
      energy,
      genreIds: genres,
      genreLabels: genres.map((id) => findGenre(id)?.label || id),
    });
  }

  return stages;
}

function normaliseModelStages(raw, brief) {
  if (!raw || !Array.isArray(raw.stages) || raw.stages.length < 3) return null;

  const stages = raw.stages.slice(0, 6).map((stage, index) => {
    const energy = clamp(Number(stage.energy), 0, 1);
    const safeEnergy = Number.isFinite(energy)
      ? energy
      : brief.startEnergy + ((brief.endEnergy - brief.startEnergy) * index) / 4;

    const genreIds = [];
    for (const value of Array.isArray(stage.genres) ? stage.genres : []) {
      const genre = findGenre(value);
      if (genre && !genreIds.includes(genre.id)) genreIds.push(genre.id);
    }

    const chosen = genreIds.length ? genreIds : genresForEnergy(safeEnergy);
    return {
      label: String(stage.label || labelForEnergy(safeEnergy)).slice(0, 40),
      energy: Math.round(safeEnergy * 100) / 100,
      genreIds: chosen,
      genreLabels: chosen.map((id) => findGenre(id)?.label || id),
    };
  });

  return {
    title: String(raw.title || brief.title).slice(0, 80),
    summary: String(raw.summary || brief.summary).slice(0, 240),
    stages,
  };
}

function stageIntent(stage, brief) {
  return {
    genreIds: stage.genreIds,
    genreLabels: stage.genreLabels,
    moodIds: [],
    moodLabels: [stage.label],
    activityId: null,
    activityLabel: null,
    energy: stage.energy,
    keywords: [],
    seedArtist: "",
    avoid: [],
  };
}

export async function buildJourney(prompt, { profile = null } = {}) {
  const brief = parseJourneyBrief(prompt);
  const modelPlan = await askJourneyPlan(prompt);
  const normalised = modelPlan ? normaliseModelStages(modelPlan, brief) : null;

  const title = normalised?.title || brief.title;
  const summary = normalised?.summary || brief.summary;
  const stages = normalised?.stages || ruleStages(brief);
  const source = normalised ? "model" : "rules";

  // Place the genres the listener explicitly named into the part of the arc
  // where their energy belongs. Afrobeats should lift the peak, not the
  // acoustic opening.
  const explicitEntries = brief.explicitGenres
    .map((id) => findGenre(id))
    .filter(Boolean);

  for (const stage of stages) {
    const compatible = explicitEntries
      .filter((genre) => Math.abs(genre.energy - stage.energy) <= 0.22)
      .map((genre) => genre.id);

    if (!compatible.length) continue;
    const rest = stage.genreIds.filter((id) => !compatible.includes(id));
    const ids = [...new Set([...compatible, ...rest])].slice(0, 4);
    stage.genreIds = ids;
    stage.genreLabels = ids.map((id) => findGenre(id)?.label || id);
  }

  const allGenres = [...new Set(stages.flatMap((stage) => stage.genreIds))];
  const planGenres =
    allGenres.length > 6
      ? [...new Set([...allGenres.slice(0, 2), ...allGenres.slice(-4)])]
      : allGenres;
  const plan = buildSearchPlan({
    genreIds: planGenres,
    moodIds: [],
    activityId: null,
    seedArtist: "",
    keywords: [],
  });

  const pool = await searchMany(plan, { limit: 20 });

  const used = new Set();
  const filledStages = [];

  for (const stage of stages) {
    const intent = stageIntent(stage, brief);
    const stagePool = pool.filter((track) =>
      stage.genreIds.some((genreId) => genreMatches(track, genreId)),
    );
    const rankingPool = stagePool.length >= 3 ? stagePool : pool;
    const selected = rankTracks(rankingPool, intent, profile, {
      limit: 3,
      diversity: 2,
      excludeIds: used,
      freshnessWeight: 0.35,
    });

    for (const track of selected) used.add(track.id);

    filledStages.push({
      ...stage,
      tracks: selected,
    });
  }

  const tracks = filledStages.flatMap((stage) =>
    stage.tracks.map((track) => ({
      ...track,
      journeyStage: stage.label,
    })),
  );

  const status = publicAiStatus();
  const aiStatus =
    source === "rules" && status.configured
      ? {
          ...status,
          mode: "local",
          model: "VibeSound arc planner",
          provider: "on-device rules",
          degraded: true,
          note: "The configured AI model was unavailable, so the built-in arc planner was used.",
        }
      : status;

  return {
    title,
    summary,
    brief,
    stages: filledStages,
    tracks,
    trackCount: tracks.length,
    source,
    aiStatus,
    meta: {
      catalogue: "Apple Music",
      method:
        "Stages are filled by energy-aware ranking over live catalogue results. 30-second previews are used for playback.",
      modelUsed: source === "model",
    },
  };
}
