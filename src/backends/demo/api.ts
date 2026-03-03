/**
 * Deezer public API client.
 * All requests go through the Rust `http_get_json` proxy to bypass CORS.
 */

import { invoke } from "@tauri-apps/api/core"
import type {
  DzTrack,
  DzAlbum,
  DzArtist,
  DzGenre,
  DzChart,
  DzSearchResult,
} from "./types"

const BASE = "https://api.deezer.com"

async function get<T>(path: string): Promise<T> {
  const url = `${BASE}${path}`
  return invoke<T>("http_get_json", { url })
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export function searchAll(q: string, limit = 25): Promise<DzSearchResult<DzTrack>> {
  return get(`/search?q=${encodeURIComponent(q)}&limit=${limit}`)
}

export function searchArtists(q: string, limit = 10): Promise<DzSearchResult<DzArtist>> {
  return get(`/search/artist?q=${encodeURIComponent(q)}&limit=${limit}`)
}

export function searchAlbums(q: string, limit = 10): Promise<DzSearchResult<DzAlbum>> {
  return get(`/search/album?q=${encodeURIComponent(q)}&limit=${limit}`)
}

// ---------------------------------------------------------------------------
// Single-item fetch
// ---------------------------------------------------------------------------

export function getTrack(id: number): Promise<DzTrack> {
  return get(`/track/${id}`)
}

export function getAlbum(id: number): Promise<DzAlbum> {
  return get(`/album/${id}`)
}

export function getAlbumTracks(id: number): Promise<DzSearchResult<DzTrack>> {
  return get(`/album/${id}/tracks?limit=200`)
}

export function getArtist(id: number): Promise<DzArtist> {
  return get(`/artist/${id}`)
}

export function getArtistTop(id: number, limit = 10): Promise<DzSearchResult<DzTrack>> {
  return get(`/artist/${id}/top?limit=${limit}`)
}

export function getArtistAlbums(id: number, limit = 50): Promise<DzSearchResult<DzAlbum>> {
  return get(`/artist/${id}/albums?limit=${limit}`)
}

export function getArtistRelated(id: number, limit = 20): Promise<DzSearchResult<DzArtist>> {
  return get(`/artist/${id}/related?limit=${limit}`)
}

// ---------------------------------------------------------------------------
// Charts & genres
// ---------------------------------------------------------------------------

export function getChart(): Promise<DzChart> {
  return get("/chart")
}

export function getGenres(): Promise<{ data: DzGenre[] }> {
  return get("/genre")
}

export function getGenreArtists(id: number, limit = 50): Promise<DzSearchResult<DzArtist>> {
  return get(`/genre/${id}/artists?limit=${limit}`)
}
