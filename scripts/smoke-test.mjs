/**
 * Small smoke test for a running VibeSound AI server.
 * Usage: node scripts/smoke-test.mjs [baseUrl]
 */
const base = process.argv[2] || "http://127.0.0.1:3000";
let failures = 0;

function check(name, condition, detail = "") {
  const mark = condition ? "PASS" : "FAIL";
  console.log(`${mark}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!condition) failures += 1;
}

async function getJson(path) {
  const response = await fetch(base + path);
  return { response, data: await response.json() };
}

const health = await getJson("/api/ai/status");
check("AI status endpoint", health.response.ok, `${health.data.mode} / ${health.data.model}`);

const home = await getJson("/api/music/home");
check("Home catalogue", home.response.ok && home.data.data.latest.length > 0,
  `${home.data.data.latest.length} songs, ${home.data.data.albums.length} albums`);

const search = await getJson("/api/music/songs?query=tems");
check("Song search", search.response.ok && search.data.data.results.length > 0,
  `${search.data.data.results.length} results`);

const companionResponse = await fetch(base + "/api/ai/companion", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    prompt: "I'm getting ready to go out. Give me confident, energetic Afrobeats.",
  }),
});
const companion = await companionResponse.json();
check("AI Companion", companionResponse.ok && companion.tracks.length > 0,
  `${companion.source} path, ${companion.tracks.length} tracks, ${companion.intent.summary}`);

const journeyResponse = await fetch(base + "/api/ai/journey", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    prompt: "Start calm and acoustic, then build into euphoric Afrobeats and dance.",
  }),
});
const journey = await journeyResponse.json();
check("AI Playlist Journey", journeyResponse.ok && journey.tracks.length > 0,
  `${journey.stages.length} stages, ${journey.trackCount} tracks`);

const africa = await getJson("/api/music/africa");
check("African discovery", africa.response.ok && africa.data.data.artists.length > 0,
  `${africa.data.data.artists.length} artists`);

const forYouResponse = await fetch(base + "/api/music/for-you", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ profile: null }),
});
const forYou = await forYouResponse.json();
check("For You starter mix", forYouResponse.ok && forYou.tracks.length > 0,
  `${forYou.tracks.length} tracks`);

for (const page of ["/", "/companion", "/for-you", "/africa", "/journey"]) {
  const response = await fetch(base + page);
  const html = await response.text();
  check(`Page ${page}`, response.ok && html.includes("VibeSound"),
    `status ${response.status}`);
}

console.log(failures ? `\n${failures} check(s) failed.` : "\nAll smoke checks passed.");
process.exit(failures ? 1 : 0);
