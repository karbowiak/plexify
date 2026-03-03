/**
 * TypeScript wrappers around Tauri invoke() calls for the Radio Browser API.
 */

import { invoke } from "@tauri-apps/api/core"

// ---------------------------------------------------------------------------
// Types mirroring Rust models
// ---------------------------------------------------------------------------

export interface RadioStation {
  uuid: string
  name: string
  stream_url: string
  homepage: string
  favicon: string
  tags: string[]
  country: string
  country_code: string
  language: string
  codec: string
  bitrate: number
  is_hls: boolean
  votes: number
  click_count: number
  click_trend: number
}

export interface RadioCountry {
  name: string
  code: string
  station_count: number
}

export interface RadioTag {
  name: string
  station_count: number
}

export interface SearchParams {
  name?: string
  tag?: string
  country?: string
  country_code?: string
  language?: string
  order?: string
  limit?: number
  offset?: number
}

// ---------------------------------------------------------------------------
// Invoke wrappers
// ---------------------------------------------------------------------------

export function radiobrowserSearch(params: SearchParams): Promise<RadioStation[]> {
  return invoke("radiobrowser_search", { params })
}

export function radiobrowserTopStations(category: string, count: number): Promise<RadioStation[]> {
  return invoke("radiobrowser_top_stations", { category, count })
}

export function radiobrowserCountries(): Promise<RadioCountry[]> {
  return invoke("radiobrowser_countries")
}

export function radiobrowserTags(limit: number): Promise<RadioTag[]> {
  return invoke("radiobrowser_tags", { limit })
}

export function radiobrowserClick(uuid: string): Promise<void> {
  return invoke("radiobrowser_click", { uuid })
}
