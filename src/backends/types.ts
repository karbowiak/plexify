import type { ProviderCapabilities } from "../providers/types"
import type { ComponentType } from "react"

export interface BackendDefinition {
  id: string
  name: string
  description: string
  icon: ComponentType<{ size?: number }>
  capabilities: ProviderCapabilities
  SettingsComponent: ComponentType
  useIsConnected: () => boolean
  loadAndConnect: () => Promise<void>
  disconnectAndClear: () => Promise<void>
}

export interface MetadataCapabilities {
  artistBio: boolean
  artistImages: boolean
  albumCovers: boolean
  genres: boolean
  tags: boolean
  fanCounts: boolean
  listenerCounts: boolean
  similarArtists: boolean
  trackInfo: boolean
  scrobble: boolean
}

export interface MetadataBackendDefinition {
  id: string
  name: string
  description: string
  icon: ComponentType<{ size?: number }>
  capabilities: MetadataCapabilities
  SettingsComponent: ComponentType
  useIsEnabled: () => boolean
  clearCache?: () => void
}
