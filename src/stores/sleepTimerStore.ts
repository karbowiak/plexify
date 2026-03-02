import { create } from "zustand"
import { persist } from "zustand/middleware"

// ---------------------------------------------------------------------------
// Module-level timer handle — survives store re-renders
// ---------------------------------------------------------------------------

let _timerId: ReturnType<typeof setTimeout> | null = null

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface SleepTimerState {
  /** UTC timestamp (ms) when playback will pause. Null when timer is off. */
  endsAt: number | null

  start: (minutes: number) => void
  cancel: () => void
  /** Call once on app mount to reschedule any timer that survived a refresh. */
  hydrate: () => void
}

export const useSleepTimerStore = create<SleepTimerState>()(
  persist(
    (set, get) => ({
      endsAt: null,

      start: (minutes: number) => {
        if (_timerId !== null) clearTimeout(_timerId)
        const endsAt = Date.now() + minutes * 60 * 1000
        set({ endsAt })
        _timerId = setTimeout(() => {
          // Lazily import to avoid circular deps — playerStore imports nothing from here
          import("./playerStore").then(({ usePlayerStore }) => {
            usePlayerStore.getState().pause()
          })
          set({ endsAt: null })
          _timerId = null
        }, minutes * 60 * 1000)
      },

      cancel: () => {
        if (_timerId !== null) {
          clearTimeout(_timerId)
          _timerId = null
        }
        set({ endsAt: null })
      },

      hydrate: () => {
        const { endsAt } = get()
        if (endsAt === null) return
        const remaining = endsAt - Date.now()
        if (remaining <= 0) {
          // Timer already expired while app was closed — clear silently
          set({ endsAt: null })
          return
        }
        // Reschedule for the remaining time
        if (_timerId !== null) clearTimeout(_timerId)
        _timerId = setTimeout(() => {
          import("./playerStore").then(({ usePlayerStore }) => {
            usePlayerStore.getState().pause()
          })
          set({ endsAt: null })
          _timerId = null
        }, remaining)
      },
    }),
    {
      name: "plex-sleep-timer-v1",
      partialize: (state) => ({ endsAt: state.endsAt }),
    },
  ),
)
