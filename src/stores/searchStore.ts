import { create } from "zustand"
import { recordRecentSearch } from "../lib/recentSearches"
import type { MusicItem } from "../types/music"
import { useProviderStore } from "./providerStore"

interface SearchState {
  query: string
  results: MusicItem[]
  isSearching: boolean
  error: string | null

  setQuery: (q: string) => void
  search: (q: string) => Promise<void>
  clear: () => void
}

export const useSearchStore = create<SearchState>((set) => ({
  query: "",
  results: [],
  isSearching: false,
  error: null,

  setQuery: (q: string) => set({ query: q }),

  search: async (q: string) => {
    if (!q.trim()) {
      set({ results: [], isSearching: false })
      return
    }
    const provider = useProviderStore.getState().provider
    if (!provider) return
    set({ isSearching: true, error: null, query: q })
    try {
      const results = await provider.search(q)
      set({ results, isSearching: false })
      recordRecentSearch(q)
    } catch (err) {
      set({ error: String(err), isSearching: false })
    }
  },

  clear: () => set({ query: "", results: [], isSearching: false, error: null }),
}))