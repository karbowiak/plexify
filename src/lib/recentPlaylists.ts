const STORAGE_KEY = "plex-recent-playlist-ids"
const MAX_RECENT = 5

export function getRecentPlaylistIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as string[]
  } catch {
    return []
  }
}

export function recordRecentPlaylist(id: string): void {
  const ids = getRecentPlaylistIds().filter(i => i !== id)
  ids.unshift(id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, MAX_RECENT)))
}
