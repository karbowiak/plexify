import { create } from "zustand"
import type { MusicTrack, MusicAlbum, MusicArtist, MusicPlaylist } from "../types/music"

type DebugData = MusicTrack | MusicAlbum | MusicArtist | MusicPlaylist

interface DebugPanelState {
  open: boolean
  type: "track" | "album" | "artist" | "playlist" | null
  data: DebugData | null
  show: (type: "track" | "album" | "artist" | "playlist", data: DebugData) => void
  close: () => void
}

export const useDebugPanelStore = create<DebugPanelState>((set) => ({
  open: false,
  type: null,
  data: null,

  show: (type, data) => set({ open: true, type, data }),
  close: () => set({ open: false }),
}))
