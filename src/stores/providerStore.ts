import { create } from "zustand"
import type { MusicProvider, ProviderCapabilities } from "../providers/types"

interface ProviderState {
  provider: MusicProvider | null
  capabilities: ProviderCapabilities | null
  setProvider: (p: MusicProvider) => void
  clearProvider: () => void
}

export const useProviderStore = create<ProviderState>((set) => ({
  provider: null,
  capabilities: null,
  setProvider: (p) => set({ provider: p, capabilities: p.capabilities }),
  clearProvider: () => set({ provider: null, capabilities: null }),
}))
