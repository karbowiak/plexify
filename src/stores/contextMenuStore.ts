import { create } from "zustand"
import type { MusicTrack, MusicAlbum, MusicArtist, MusicPlaylist } from "../types/music"

export type ContextMenuType = "track" | "album" | "artist" | "playlist"

type ContextMenuData = MusicTrack | MusicAlbum | MusicArtist | MusicPlaylist

interface ContextMenuState {
  open: boolean
  x: number
  y: number
  type: ContextMenuType | null
  data: ContextMenuData | null
  show: (x: number, y: number, type: ContextMenuType, data: ContextMenuData) => void
  close: () => void
}

export const useContextMenuStore = create<ContextMenuState>((set) => ({
  open: false,
  x: 0,
  y: 0,
  type: null,
  data: null,

  show: (x, y, type, data) => set({ open: true, x, y, type, data }),
  close: () => set({ open: false }),
}))
