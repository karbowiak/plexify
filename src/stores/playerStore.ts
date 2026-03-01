import { create } from "zustand"
import { listen, type UnlistenFn } from "@tauri-apps/api/event"
import {
  audioPlay,
  audioPause,
  audioResume,
  audioSeek,
  audioSetVolume,
  audioPreloadNext,
  buildItemUri,
  createPlayQueue,
  getStreamUrl,
  reportTimeline,
  markPlayed,
} from "../lib/plex"
import type { Track } from "../types/plex"
import { useConnectionStore } from "./connectionStore"

interface PlayerState {
  currentTrack: Track | null
  queue: Track[]
  queueIndex: number
  queueId: number | null
  isPlaying: boolean
  isBuffering: boolean
  positionMs: number
  shuffle: boolean
  repeat: 0 | 1 | 2
  volume: number

  playTrack: (track: Track, context?: Track[]) => Promise<void>
  /** Play a Plex URI via a server-side play queue. Handles full playlists with shuffle. */
  playFromUri: (uri: string, forceShuffle?: boolean) => Promise<void>
  pause: () => void
  resume: () => void
  next: () => void
  prev: () => void
  seekTo: (ms: number) => void
  setVolume: (v: number) => void
  toggleShuffle: () => void
  cycleRepeat: () => void
  updatePosition: (ms: number) => void

  /** Initialize Tauri event listeners for the Rust audio engine. Call once on app mount. */
  initAudioEvents: () => Promise<() => void>
}

/** Send a track to the Rust audio engine for playback. */
async function sendToAudioEngine(track: Track): Promise<void> {
  const partKey = track.media[0]?.parts[0]?.key
  if (!partKey) return

  const url = await getStreamUrl(partKey)
  await audioPlay(
    url,
    track.rating_key,
    track.duration,
    track.media[0]?.parts[0]?.id ?? 0,
    track.parent_key,
    track.index,
  )
}

/** Pre-buffer the next track in queue for gapless playback. */
async function preloadNextTrack(queue: Track[], queueIndex: number, repeat: 0 | 1 | 2): Promise<void> {
  let nextIndex = queueIndex + 1
  if (nextIndex >= queue.length) {
    if (repeat === 2) nextIndex = 0
    else return // No next track
  }

  const nextTrack = queue[nextIndex]
  if (!nextTrack) return

  const partKey = nextTrack.media[0]?.parts[0]?.key
  if (!partKey) return

  try {
    const url = await getStreamUrl(partKey)
    await audioPreloadNext(
      url,
      nextTrack.rating_key,
      nextTrack.duration,
      nextTrack.media[0]?.parts[0]?.id ?? 0,
      nextTrack.parent_key,
      nextTrack.index,
    )
  } catch {
    // Pre-load failure is non-critical
  }
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  queueIndex: 0,
  queueId: null,
  isPlaying: false,
  isBuffering: false,
  positionMs: 0,
  shuffle: false,
  repeat: 0,
  volume: 80,

  playTrack: async (track: Track, context?: Track[]) => {
    const { sectionUuid } = useConnectionStore.getState()
    const itemKey = `/library/metadata/${track.rating_key}`
    const uri = sectionUuid ? buildItemUri(sectionUuid, itemKey) : itemKey
    const { shuffle, repeat } = get()

    // Update UI immediately — never block the player display on network calls
    const queue = context ?? [track]
    const queueIndex = Math.max(0, context ? context.findIndex(t => t.rating_key === track.rating_key) : 0)
    set({ currentTrack: track, queue, queueIndex, isPlaying: true, positionMs: 0 })
    void reportTimeline(track.rating_key, "playing", 0, track.duration)

    try {
      // Start audio + register server-side queue in parallel
      const [playQueue] = await Promise.all([
        createPlayQueue(uri, shuffle, repeat),
        sendToAudioEngine(track),
      ])
      set({ queueId: playQueue.id })
    } catch (err) {
      console.error("playTrack failed:", err)
    }
  },

  playFromUri: async (uri: string, forceShuffle?: boolean) => {
    const { shuffle, repeat } = get()
    const shouldShuffle = forceShuffle ?? shuffle
    try {
      const playQueue = await createPlayQueue(uri, shouldShuffle, repeat)
      if (playQueue.items.length === 0) return
      const firstTrack = playQueue.items[0]

      // Update UI as soon as we know what track is first — before the audio fetch
      set({
        currentTrack: firstTrack,
        queue: playQueue.items,
        queueIndex: 0,
        queueId: playQueue.id,
        isPlaying: true,
        positionMs: 0,
        shuffle: shouldShuffle,
      })
      void reportTimeline(firstTrack.rating_key, "playing", 0, firstTrack.duration)

      await sendToAudioEngine(firstTrack)
    } catch (err) {
      console.error("playFromUri failed:", err)
    }
  },

  pause: () => {
    void audioPause()
    set({ isPlaying: false })
    const { currentTrack, positionMs } = get()
    if (currentTrack) {
      void reportTimeline(currentTrack.rating_key, "paused", positionMs, currentTrack.duration)
    }
  },

  resume: () => {
    void audioResume()
    set({ isPlaying: true })
    const { currentTrack, positionMs } = get()
    if (currentTrack) {
      void reportTimeline(currentTrack.rating_key, "playing", positionMs, currentTrack.duration)
    }
  },

  next: () => {
    const { queue, queueIndex, repeat } = get()
    if (queue.length === 0) return

    let nextIndex = queueIndex + 1
    if (nextIndex >= queue.length) {
      if (repeat === 2) nextIndex = 0
      else {
        set({ isPlaying: false })
        return
      }
    }
    void get().playTrack(queue[nextIndex], queue)
  },

  prev: () => {
    const { queue, queueIndex, positionMs, currentTrack } = get()
    if (positionMs > 3000 && currentTrack) {
      void get().playTrack(currentTrack, queue)
      return
    }
    const prevIndex = Math.max(0, queueIndex - 1)
    if (queue[prevIndex]) void get().playTrack(queue[prevIndex], queue)
  },

  seekTo: (ms: number) => {
    void audioSeek(ms)
    set({ positionMs: ms })
    const { currentTrack } = get()
    if (currentTrack) {
      void reportTimeline(currentTrack.rating_key, "playing", ms, currentTrack.duration)
    }
  },

  setVolume: (v: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(v)))
    // Cubic curve: maps 0-100 slider to 0.0-1.0 gain matching human loudness perception
    const gain = clamped <= 0 ? 0 : clamped >= 100 ? 1 : Math.pow(clamped / 100, 3)
    void audioSetVolume(gain)
    set({ volume: clamped })
  },

  toggleShuffle: () => set(s => ({ shuffle: !s.shuffle })),

  cycleRepeat: () => set(s => ({ repeat: ((s.repeat + 1) % 3) as 0 | 1 | 2 })),

  updatePosition: (ms: number) => set({ positionMs: ms }),

  initAudioEvents: async () => {
    const unlisteners: UnlistenFn[] = []

    // Position updates from the Rust audio engine (~4x/sec)
    unlisteners.push(
      await listen<{ position_ms: number; duration_ms: number }>("audio://position", (e) => {
        const { currentTrack, queue, queueIndex, repeat } = get()
        set({ positionMs: e.payload.position_ms })

        // Trigger pre-load when approaching end of track (30s before end)
        if (currentTrack && e.payload.duration_ms > 0) {
          const remaining = e.payload.duration_ms - e.payload.position_ms
          if (remaining > 0 && remaining < 30000 && remaining > 29500) {
            void preloadNextTrack(queue, queueIndex, repeat)
          }
        }
      }),
    )

    // Playback state changes
    unlisteners.push(
      await listen<{ type: string; state: string }>("audio://state", (e) => {
        const state = e.payload.state
        set({
          isPlaying: state === "playing",
          isBuffering: state === "buffering",
        })
      }),
    )

    // Track ended naturally — scrobble + advance to next
    unlisteners.push(
      await listen<{ type: string; rating_key: number }>("audio://track-ended", (e) => {
        // Scrobble the completed track
        void markPlayed(e.payload.rating_key)
        const { currentTrack } = get()
        if (currentTrack) {
          void reportTimeline(currentTrack.rating_key, "stopped", currentTrack.duration, currentTrack.duration)
        }
        get().next()
      }),
    )

    // Audio errors
    unlisteners.push(
      await listen<{ type: string; message: string }>("audio://error", (e) => {
        console.error("Audio engine error:", e.payload.message)
      }),
    )

    // Return cleanup function
    return () => {
      for (const unlisten of unlisteners) {
        unlisten()
      }
    }
  },
}))
