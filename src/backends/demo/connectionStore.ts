import { create } from "zustand"
import { DemoProvider } from "./provider"
import { useProviderStore } from "../../stores/providerStore"
import { useLibraryStore } from "../../stores/libraryStore"

interface DemoConnectionState {
  isConnected: boolean
  isLoading: boolean
  connect: () => Promise<void>
  disconnect: () => void
}

export const useDemoConnectionStore = create<DemoConnectionState>((set) => ({
  isConnected: false,
  isLoading: false,

  connect: async () => {
    set({ isLoading: true })
    const provider = new DemoProvider()
    await provider.connect({})
    useProviderStore.getState().setProvider(provider)
    set({ isConnected: true, isLoading: false })
  },

  disconnect: () => {
    useProviderStore.getState().clearProvider()
    useLibraryStore.getState().clearAll()
    set({ isConnected: false })
  },
}))
