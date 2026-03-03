import { useState } from "react"
import { useShallow } from "zustand/react/shallow"
import { useLocation } from "wouter"
import { useDemoConnectionStore } from "./connectionStore"
import { useLibraryStore } from "../../stores/libraryStore"
import * as demoState from "./state"

export function DemoSettings() {
  const { isConnected, isLoading, connect, disconnect } = useDemoConnectionStore(
    useShallow(s => ({
      isConnected: s.isConnected,
      isLoading: s.isLoading,
      connect: s.connect,
      disconnect: s.disconnect,
    }))
  )

  const { fetchRecentlyAdded, fetchHubs } = useLibraryStore(
    useShallow(s => ({
      fetchRecentlyAdded: s.fetchRecentlyAdded,
      fetchHubs: s.fetchHubs,
    }))
  )

  const [, navigate] = useLocation()
  const [clearing, setClearing] = useState(false)
  const stats = demoState.getStats()

  const handleConnect = async () => {
    await connect()
    void fetchRecentlyAdded(50)
    void fetchHubs()
    navigate("/")
  }

  const handleDisconnect = () => {
    disconnect()
  }

  const handleClear = () => {
    setClearing(true)
    demoState.clearAll()
    setTimeout(() => setClearing(false), 400)
  }

  return (
    <div className="max-w-xl space-y-6">
      {/* Connection status */}
      <div className="flex items-center gap-3 rounded-xl bg-white/5 px-5 py-4">
        <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${isConnected ? "bg-accent" : "bg-white/20"}`} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">
            {isConnected ? "Connected to Demo" : "Not connected"}
          </p>
          <p className="mt-0.5 text-xs text-white/40">
            Real music data from Deezer. 30-second previews, no account needed.
          </p>
        </div>
        {isConnected && (
          <button
            onClick={handleDisconnect}
            className="ml-auto flex-shrink-0 rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            Disconnect
          </button>
        )}
      </div>

      {!isConnected && (
        <button
          onClick={() => void handleConnect()}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-3 rounded-full bg-accent py-3 text-sm font-bold text-black hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
        >
          {isLoading ? "Connecting..." : "Connect to Demo"}
        </button>
      )}

      {isConnected && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/30">Local Data</h2>
          <div className="rounded-xl border border-white/10 bg-white/3 divide-y divide-white/5">
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-sm text-white/60">Playlists</span>
              <span className="text-sm font-medium text-white tabular-nums">{stats.playlistCount}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-sm text-white/60">Rated items</span>
              <span className="text-sm font-medium text-white tabular-nums">{stats.ratedCount}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-sm text-white/60">Total plays</span>
              <span className="text-sm font-medium text-white tabular-nums">{stats.playCount}</span>
            </div>
          </div>
          <button
            onClick={handleClear}
            disabled={clearing || (stats.playlistCount + stats.ratedCount === 0)}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:border-white/20 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {clearing ? "Cleared" : "Clear Local Data"}
          </button>
        </div>
      )}
    </div>
  )
}
