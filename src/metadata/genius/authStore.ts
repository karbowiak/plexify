import { create } from "zustand"
import { loadAppSettings } from "../../lib/settings"
import {
  geniusSaveCredentials,
  geniusDisconnect as geniusDisconnectApi,
  geniusSetEnabled as geniusSetEnabledApi,
  geniusSetAlwaysFetch as geniusSetAlwaysFetchApi,
} from "./api"

interface GeniusState {
  /** True if the user has configured Genius credentials. */
  hasCredentials: boolean
  /** Whether Genius lyrics fetching is enabled. */
  isEnabled: boolean
  /** When true, fetch Genius lyrics even when Plex provides them. */
  alwaysFetch: boolean

  initialize: () => Promise<void>
  saveCredentials: (clientId: string, clientSecret: string) => Promise<void>
  setEnabled: (enabled: boolean) => Promise<void>
  setAlwaysFetch: (alwaysFetch: boolean) => Promise<void>
  disconnect: () => Promise<void>
}

export const useGeniusStore = create<GeniusState>((set) => ({
  hasCredentials: false,
  isEnabled: false,
  alwaysFetch: false,

  initialize: async () => {
    try {
      const settings = await loadAppSettings()
      set({
        hasCredentials: !!settings.genius_client_id,
        isEnabled: settings.genius_enabled,
        alwaysFetch: settings.genius_always_fetch,
      })
    } catch {
      // Settings not yet saved — keep defaults
    }
  },

  saveCredentials: async (clientId, clientSecret) => {
    await geniusSaveCredentials(clientId, clientSecret)
    await geniusSetEnabledApi(true)
    set({ hasCredentials: true, isEnabled: true })
  },

  setEnabled: async (enabled) => {
    await geniusSetEnabledApi(enabled)
    set({ isEnabled: enabled })
  },

  setAlwaysFetch: async (alwaysFetch) => {
    await geniusSetAlwaysFetchApi(alwaysFetch)
    set({ alwaysFetch })
  },

  disconnect: async () => {
    await geniusDisconnectApi()
    set({ hasCredentials: false, isEnabled: false, alwaysFetch: false })
  },
}))
