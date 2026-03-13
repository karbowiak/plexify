import { invoke } from "@tauri-apps/api/core"

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export const geniusSaveCredentials = (clientId: string, clientSecret: string): Promise<void> =>
  invoke("genius_save_credentials", { clientId, clientSecret })

export const geniusDisconnect = (): Promise<void> => invoke("genius_disconnect")

export const geniusSetEnabled = (enabled: boolean): Promise<void> =>
  invoke("genius_set_enabled", { enabled })

export const geniusSetAlwaysFetch = (alwaysFetch: boolean): Promise<void> =>
  invoke("genius_set_always_fetch", { alwaysFetch })

// ---------------------------------------------------------------------------
// Search & Lyrics
// ---------------------------------------------------------------------------

export const geniusSearch = (artist: string, track: string): Promise<GeniusSearchHit[]> =>
  invoke("genius_search", { artist, track })

export const geniusGetLyrics = (songUrl: string): Promise<GeniusLyricLine[]> =>
  invoke("genius_get_lyrics", { songUrl })

// ---------------------------------------------------------------------------
// TypeScript interfaces
// ---------------------------------------------------------------------------

export interface GeniusSearchHit {
  id: number
  title: string
  artist: string
  url: string
  thumbnail_url: string
  pageviews: number
  relevance: number
}

export interface GeniusLyricLine {
  text: string
}
