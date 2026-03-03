import type { BackendDefinition } from "../types"
import { useDemoConnectionStore } from "./connectionStore"
import { DemoSettings } from "./settings"

function DemoIcon({ size = 18 }: { size?: number }) {
  return (
    <svg height={size} width={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  )
}

export const demoBackend: BackendDefinition = {
  id: "demo",
  name: "Demo",
  description: "Explore the app with real music data from Deezer. 30-second previews, no account needed.",
  icon: DemoIcon,
  capabilities: {
    search: true,
    playlists: true,
    playlistEdit: true,
    ratings: true,
    radio: false,
    sonicSimilarity: false,
    djModes: false,
    playQueues: false,
    lyrics: false,
    streamLevels: false,
    hubs: true,
    stations: false,
    tags: true,
    scrobble: false,
    mixTracks: false,
    browseArtists: true,
    browseAlbums: true,
    browseTracks: true,
    syncArtists: false,
    syncAlbums: false,
    syncTracks: false,
  },
  SettingsComponent: DemoSettings,
  useIsConnected: () => useDemoConnectionStore(s => s.isConnected),
  loadAndConnect: () => Promise.resolve(), // don't auto-connect
  disconnectAndClear: async () => {
    useDemoConnectionStore.getState().disconnect()
  },
}
