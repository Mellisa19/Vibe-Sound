/**
 * Client-side catalogue helpers.
 *
 * The original MusicHub called an external JioSaavn deployment directly from
 * the browser. VibeSound AI routes everything through its own server routes so
 * the data source can change without touching UI components, and so no
 * provider details leak into the client bundle.
 */
const BASE = "/api/music";

async function request(path) {
  const response = await fetch(`${BASE}${path}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Music request failed (${response.status})`);
  }
  return response;
}

export const getSongsByQuery = async (query) =>
  request(`/songs?query=${encodeURIComponent(String(query || ""))}`);

export const getSongsById = async (id) =>
  request(`/songs/${encodeURIComponent(String(id))}`);

export const getSongsSuggestions = async (id) =>
  request(`/suggestions/${encodeURIComponent(String(id))}`);

export const searchAlbumByQuery = async (query) =>
  request(`/albums?query=${encodeURIComponent(String(query || ""))}`);

export const getAlbumById = async (id) =>
  request(`/albums/${encodeURIComponent(String(id))}`);

export const getHomeFeed = async () => request(`/home`);

export const getAfricaFeed = async (scene = "") =>
  request(`/africa${scene ? `?scene=${encodeURIComponent(scene)}` : ""}`);

export const getForYouFeed = async (profile) => {
  const response = await fetch(`${BASE}/for-you`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ profile }),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`For You request failed (${response.status})`);
  }
  return response.json();
};
