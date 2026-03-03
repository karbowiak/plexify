import type { BackendDefinition } from "../types"
import { useConnectionStore } from "./connectionStore"
import { PlexSettings } from "./settings"

function PlexIcon({ size = 18 }: { size?: number }) {
  return (
    <svg height={size} width={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.994 2C6.477 2 2 6.477 2 11.994S6.477 22 11.994 22 22 17.523 22 12.006 17.523 2 11.994 2zm5.284 12.492l-7.285 4.206a.566.566 0 0 1-.567 0 .572.572 0 0 1-.284-.491V5.793c0-.202.109-.39.284-.491a.566.566 0 0 1 .567 0l7.285 4.206a.572.572 0 0 1 .284.491c0 .204-.108.39-.284.493z" />
    </svg>
  )
}

export const plexBackend: BackendDefinition = {
  id: "plex",
  name: "Plex",
  description: "Connect to a Plex Media Server for music streaming with sonic features, radio, and DJ modes.",
  icon: PlexIcon,
  capabilities: {
    search: true,
    playlists: true,
    playlistEdit: true,
    ratings: true,
    radio: true,
    sonicSimilarity: true,
    djModes: true,
    playQueues: true,
    lyrics: true,
    streamLevels: true,
    hubs: true,
    stations: true,
    tags: true,
    scrobble: true,
    mixTracks: true,
    browseArtists: true,
    browseAlbums: true,
    browseTracks: true,
    syncArtists: true,
    syncAlbums: true,
    syncTracks: true,
  },
  SettingsComponent: PlexSettings,
  useIsConnected: () => useConnectionStore(s => s.isConnected),
  loadAndConnect: () => useConnectionStore.getState().loadAndConnect(),
  disconnectAndClear: () => useConnectionStore.getState().disconnectAndClear(),
}
