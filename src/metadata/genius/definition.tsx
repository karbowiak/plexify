import type { MetadataBackendDefinition } from "../types"
import { useGeniusStore } from "./authStore"
import { GeniusSettings } from "./settings"

function GeniusIcon({ size = 18 }: { size?: number }) {
  return (
    <svg height={size} width={size} viewBox="0 0 24 24" fill="currentColor" className="text-yellow-500">
      <path d="M12.3 2.1c-.5-.3-1.1-.3-1.6 0L3.4 6.4c-.5.3-.8.8-.8 1.4v8.4c0 .6.3 1.1.8 1.4l7.3 4.3c.5.3 1.1.3 1.6 0l7.3-4.3c.5-.3.8-.8.8-1.4V7.8c0-.6-.3-1.1-.8-1.4L12.3 2.1zM12 16c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z" />
    </svg>
  )
}

export const geniusMetadataBackend: MetadataBackendDefinition = {
  id: "genius",
  name: "Genius",
  description: "Lyrics from Genius when Plex doesn't provide them.",
  icon: GeniusIcon,
  capabilities: {
    artistBio: false,
    artistImages: false,
    albumCovers: false,
    genres: false,
    tags: false,
    fanCounts: false,
    listenerCounts: false,
    similarArtists: false,
    trackInfo: false,
    scrobble: false,
    lyrics: true,
  },
  SettingsComponent: GeniusSettings,
  useIsEnabled: () => useGeniusStore(s => s.hasCredentials),
}
