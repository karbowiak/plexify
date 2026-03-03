/**
 * Generic application settings loader.
 *
 * Calls the same Tauri command as `loadSettings()` in the Plex API but lives
 * in a provider-agnostic location so non-Plex modules (e.g. Last.fm auth store)
 * don't need to import from `backends/plex/api`.
 */

import { invoke } from "@tauri-apps/api/core"
import type { PlexSettings } from "../backends/plex/types"

/** Load saved application settings from disk. Returns empty strings if unset. */
export function loadAppSettings(): Promise<PlexSettings> {
  return invoke("load_settings")
}
