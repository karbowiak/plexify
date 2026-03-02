import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  audioSetNormalizationEnabled,
  audioSetCrossfadeWindow,
  audioSetSameAlbumCrossfade,
  audioSetPreampGain,
} from "../lib/plex"

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface AudioSettingsState {
  normalizationEnabled: boolean
  crossfadeWindowMs: number
  sameAlbumCrossfade: boolean
  preampDb: number

  setNormalizationEnabled: (enabled: boolean) => void
  setCrossfadeWindowMs: (ms: number) => void
  setSameAlbumCrossfade: (enabled: boolean) => void
  setPreampDb: (db: number) => void
  syncToEngine: () => void
}

export const useAudioSettingsStore = create<AudioSettingsState>()(
  persist(
    (set, get) => ({
      normalizationEnabled: true,
      crossfadeWindowMs: 8000,
      sameAlbumCrossfade: false,
      preampDb: 0,

      setNormalizationEnabled: (enabled) => {
        set({ normalizationEnabled: enabled })
        void audioSetNormalizationEnabled(enabled)
      },

      setCrossfadeWindowMs: (ms) => {
        set({ crossfadeWindowMs: ms })
        void audioSetCrossfadeWindow(ms)
      },

      setSameAlbumCrossfade: (enabled) => {
        set({ sameAlbumCrossfade: enabled })
        void audioSetSameAlbumCrossfade(enabled)
      },

      setPreampDb: (db) => {
        set({ preampDb: db })
        void audioSetPreampGain(db)
      },

      syncToEngine: () => {
        const { normalizationEnabled, crossfadeWindowMs, sameAlbumCrossfade, preampDb } = get()
        void audioSetNormalizationEnabled(normalizationEnabled)
        void audioSetCrossfadeWindow(crossfadeWindowMs)
        void audioSetSameAlbumCrossfade(sameAlbumCrossfade)
        void audioSetPreampGain(preampDb)
      },
    }),
    {
      name: "plex-audio-settings-v1",
      partialize: (state) => ({
        normalizationEnabled: state.normalizationEnabled,
        crossfadeWindowMs: state.crossfadeWindowMs,
        sameAlbumCrossfade: state.sameAlbumCrossfade,
        preampDb: state.preampDb,
      }),
    },
  ),
)
