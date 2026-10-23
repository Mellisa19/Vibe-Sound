/**
 * Server-only AI provider integration.
 *
 * Any OpenAI-compatible chat-completions endpoint works:
 *   - OpenAI           AI_BASE_URL=https://api.openai.com/v1
 *   - Groq             AI_BASE_URL=https://api.groq.com/openai/v1
 *   - Together / etc.  provider's OpenAI-compatible URL
 *   - Ollama (local)   AI_BASE_URL=http://localhost:11434/v1 (no key needed)
 *
 * The key is read from server environment only and is never returned to the
 * browser. If no provider is configured, callers fall back to the transparent
 * rule-based interpreter and say so explicitly.
 */

import { normalizeModelIntent, describeIntentForModel } from "./intent";

const DEFAULT_BASE = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-4o-mini";
const REQUEST_TIMEOUT_MS = 20000;

function readConfig() {
  const key =
    process.env.AI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.GROQ_API_KEY ||
    "";
  const base = (process.env.AI_BASE_URL || DEFAULT_BASE).replace(/\/+$/, "");
  const model = process.env.AI_MODEL || DEFAULT_MODEL;
  const local = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])/i.test(base);

  return {
    key,
    base,
    model,
    local,
    configured: Boolean(key) || local,
  };
}

function providerHost(base) {
  try {
    return new URL(base).host;
  } catch {
    return "custom endpoint";
  }
}

export function publicAiStatus() {
  const config = readConfig();
  return {
    configured: config.configured,
    mode: config.configured ? "model" : "local",
    model: config.configured ? config.model : "VibeSound mood interpreter",
    provider: config.configured ? providerHost(config.base) : "on-device rules",
    note: config.configured
      ? "A language model interprets the request; tracks are ranked from the live catalogue."
      : "No AI key is configured. Requests use the built-in mood/activity interpreter and live catalogue ranking.",
  };
}

async function chatJson(system, user, { temperature = 0.4 } = {}) {
  const config = readConfig();
  if (!config.configured) {
    throw new Error("AI provider is not configured");
  }

  const url = `${config.base}/chat/completions`;
  const headers = { "content-type": "application/json" };
  if (config.key) headers.authorization = `Bearer ${config.key}`;
  const timeoutMs = config.local ? 90000 : REQUEST_TIMEOUT_MS;

  const payload = {
    model: config.model,
    temperature,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
  };

  async function send(body) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
        cache: "no-store",
      });
    } finally {
      clearTimeout(timer);
    }
  }

  let response = await send(payload);

  // Some OpenAI-compatible servers reject response_format. Retry without it.
  if (response.status === 400) {
    const retryPayload = { ...payload };
    delete retryPayload.response_format;
    response = await send(retryPayload);
  }

  if (!response.ok) {
    let detail = "";
    try {
      detail = (await response.text()).slice(0, 200);
    } catch {
      detail = "";
    }
    throw new Error(`AI provider returned ${response.status}${detail ? `: ${detail}` : ""}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI provider returned an empty response");

  return extractJson(content);
}

function extractJson(content) {
  const text = String(content).trim();
  try {
    return JSON.parse(text);
  } catch {
    // Models often wrap JSON in markdown fences despite instructions.
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) {
      try {
        return JSON.parse(fenced[1]);
      } catch {
        // fall through
      }
    }

    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error("AI provider returned invalid JSON");
  }
}

const INTENT_SYSTEM = `You are the intent interpreter for VibeSound AI, a music discovery app.
Read the user's request and return ONLY a JSON object with this exact shape:
{
  "summary": "one short sentence describing the musical brief",
  "genres": ["genre ids from the allowed list"],
  "moods": ["mood ids from the allowed list"],
  "activity": "activity id from the allowed list, or null",
  "energy": 0.0 to 1.0,
  "seedArtist": "artist name the user referenced, or empty string",
  "keywords": ["up to 5 useful descriptive words"],
  "countries": ["countries or regions mentioned"],
  "avoid": ["things the user explicitly does not want"]
}
Do not invent song titles. Keep genre/mood/activity values inside the allowed lists.
${describeIntentForModel()}`;

function degradedStatus(status, note) {
  return {
    ...status,
    mode: "local",
    model: "VibeSound mood interpreter",
    provider: "on-device rules",
    degraded: true,
    note,
  };
}

export async function interpretPrompt(prompt) {
  const config = readConfig();
  const status = publicAiStatus();

  if (!config.configured) {
    const { parseIntent } = await import("./intent");
    return {
      intent: parseIntent(prompt),
      aiStatus: status,
      notice: status.note,
    };
  }

  try {
    const raw = await chatJson(
      INTENT_SYSTEM,
      `User request:\n"""${String(prompt).slice(0, 1200)}"""`,
      { temperature: 0.25 },
    );
    return {
      intent: normalizeModelIntent(raw, prompt, config.model),
      aiStatus: status,
      notice: null,
    };
  } catch (error) {
    const { parseIntent } = await import("./intent");
    const message = String(error?.message || "unknown provider error");
    let note =
      "The configured AI model could not be reached, so VibeSound used its built-in mood interpreter for this request.";

    if (/429|quota|credit|insufficient|billing/i.test(message)) {
      note =
        "The AI provider account has no remaining credits, so VibeSound used its built-in mood interpreter for this request. Add credits or switch providers to enable the model path.";
    } else if (/401|403|unauthorized|invalid.*key|api key/i.test(message)) {
      note =
        "The AI provider rejected the API key, so VibeSound used its built-in mood interpreter. Check AI_API_KEY in .env.local.";
    }

    return {
      intent: parseIntent(prompt),
      aiStatus: degradedStatus(status, note),
      notice: note,
      error: message.slice(0, 240),
    };
  }
}

const JOURNEY_SYSTEM = `You are the playlist architect for VibeSound AI.
Build an ordered listening journey from the user's brief. Return ONLY JSON:
{
  "title": "short evocative journey title",
  "summary": "one sentence describing the arc",
  "stages": [
    { "label": "short stage name", "energy": 0.0, "genres": ["allowed genre ids"] }
  ]
}
Use 4 to 6 stages. Energy must move in a deliberate direction (up, down, or a clear arc).
Never invent artists or songs. ${describeIntentForModel()}`;

export async function askJourneyPlan(prompt) {
  const config = readConfig();
  if (!config.configured) return null;

  try {
    return await chatJson(
      JOURNEY_SYSTEM,
      `User journey request:\n"""${String(prompt).slice(0, 1200)}"""`,
      { temperature: 0.5 },
    );
  } catch {
    return null;
  }
}
