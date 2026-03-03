/**
 * DemoProvider — implements MusicProvider using Deezer's public API.
 * 30-second preview playback, real search/browse, local playlist/rating state.
 */

import type { MusicProvider, ProviderCapabilities, TrackPlaybackInfo } from "../../providers/types"
import type {
  MusicTrack,
  MusicAlbum,
  MusicArtist,
  MusicPlaylist,
  MusicItem,
  MusicHub,
  PagedResult,
} from "../../types/music"
import * as api from "./api"
import * as state from "./state"
import { dzTrackToMusicTrack, dzAlbumToMusicAlbum, dzArtistToMusicArtist } from "./mappers"

/** Extract the numeric Deezer ID from our prefixed string ID. */
function dzId(id: string): number {
  return parseInt(id.replace("dz-", ""), 10)
}

/** Apply local rating + play count to a mapped track. */
function enrichTrack(t: MusicTrack): MusicTrack {
  const rating = state.getRating(t.id)
  const playCount = state.getPlayCount(t.id)
  if (rating !== null) t.userRating = rating
  if (playCount > 0) t.playCount = playCount
  return t
}

/** Track cache to avoid re-fetching for playlist items. */
const trackCache = new Map<string, MusicTrack>()

export class DemoProvider implements MusicProvider {
  readonly name = "Demo"
  readonly capabilities: ProviderCapabilities = {
    search: true,
    playlists: true,
    playlistEdit: true,
    ratings: true,
    radio: false,
    sonicSimilarity: false,
    djModes: false,
    playQueues: false,
    lyrics: false,
    streamLevels: false,
    hubs: true,
    stations: false,
    tags: true,
    scrobble: false,
    mixTracks: false,
    browseArtists: true,
    browseAlbums: true,
    browseTracks: true,
    syncArtists: false,
    syncAlbums: false,
    syncTracks: false,
  }

  private _connected = false

  // ---------------------------------------------------------------------------
  // Connection
  // ---------------------------------------------------------------------------

  async connect(_config: Record<string, unknown>): Promise<void> {
    this._connected = true
  }

  async disconnect(): Promise<void> {
    this._connected = false
    trackCache.clear()
  }

  isConnected(): boolean {
    return this._connected
  }

  // ---------------------------------------------------------------------------
  // Browse / Search
  // ---------------------------------------------------------------------------

  async search(query: string): Promise<MusicItem[]> {
    const [tracks, artists, albums] = await Promise.all([
      api.searchAll(query, 15),
      api.searchArtists(query, 5),
      api.searchAlbums(query, 5),
    ])

    const items: MusicItem[] = []

    for (const a of artists.data ?? []) {
      items.push({ ...dzArtistToMusicArtist(a), type: "artist" })
    }
    for (const a of albums.data ?? []) {
      items.push({ ...dzAlbumToMusicAlbum(a), type: "album" })
    }
    for (const t of tracks.data ?? []) {
      items.push({ ...enrichTrack(dzTrackToMusicTrack(t)), type: "track" })
    }

    return items
  }

  async getRecentlyAdded(_type?: string, limit?: number): Promise<MusicItem[]> {
    const chart = await api.getChart()
    const albums = (chart.albums?.data ?? []).slice(0, limit ?? 20)
    return albums.map(a => ({ ...dzAlbumToMusicAlbum(a), type: "album" as const }))
  }

  async getHubs(): Promise<MusicHub[]> {
    const chart = await api.getChart()
    const hubs: MusicHub[] = []

    if (chart.tracks?.data?.length) {
      hubs.push({
        title: "Top Tracks",
        identifier: "demo.chart.tracks",
        items: chart.tracks.data.slice(0, 20).map(t => ({
          ...enrichTrack(dzTrackToMusicTrack(t)),
          type: "track" as const,
        })),
        style: null,
      })
    }

    if (chart.albums?.data?.length) {
      hubs.push({
        title: "Top Albums",
        identifier: "demo.chart.albums",
        items: chart.albums.data.slice(0, 20).map(a => ({
          ...dzAlbumToMusicAlbum(a),
          type: "album" as const,
        })),
        style: null,
      })
    }

    if (chart.artists?.data?.length) {
      hubs.push({
        title: "Popular Artists",
        identifier: "demo.chart.artists",
        items: chart.artists.data.slice(0, 20).map(a => ({
          ...dzArtistToMusicArtist(a),
          type: "artist" as const,
        })),
        style: null,
      })
    }

    return hubs
  }

  // ---------------------------------------------------------------------------
  // Library
  // ---------------------------------------------------------------------------

  async getTrack(id: string): Promise<MusicTrack> {
    const cached = trackCache.get(id)
    if (cached) return enrichTrack({ ...cached })

    const t = await api.getTrack(dzId(id))
    const mapped = enrichTrack(dzTrackToMusicTrack(t))
    trackCache.set(id, mapped)
    return mapped
  }

  async getAlbum(id: string): Promise<MusicAlbum> {
    const a = await api.getAlbum(dzId(id))
    return dzAlbumToMusicAlbum(a)
  }

  async getArtist(id: string): Promise<MusicArtist> {
    const a = await api.getArtist(dzId(id))
    return dzArtistToMusicArtist(a)
  }

  async getAlbumTracks(albumId: string): Promise<MusicTrack[]> {
    const result = await api.getAlbumTracks(dzId(albumId))
    return (result.data ?? []).map(t => {
      const mapped = enrichTrack(dzTrackToMusicTrack(t))
      trackCache.set(mapped.id, mapped)
      return mapped
    })
  }

  async getArtistAlbums(artistId: string, formatFilter?: string): Promise<MusicAlbum[]> {
    const result = await api.getArtistAlbums(dzId(artistId))
    let albums = (result.data ?? []).map(a => dzAlbumToMusicAlbum(a))

    if (formatFilter === "Single") {
      albums = albums.filter(a => a.format === "Single")
    } else if (formatFilter === "!Single") {
      albums = albums.filter(a => a.format !== "Single")
    }

    return albums
  }

  async getArtistPopularTracks(artistId: string, limit?: number): Promise<MusicTrack[]> {
    const result = await api.getArtistTop(dzId(artistId), limit ?? 10)
    return (result.data ?? []).map(t => {
      const mapped = enrichTrack(dzTrackToMusicTrack(t))
      trackCache.set(mapped.id, mapped)
      return mapped
    })
  }

  async getArtistSimilar(artistId: string): Promise<MusicArtist[]> {
    const result = await api.getArtistRelated(dzId(artistId))
    return (result.data ?? []).map(a => dzArtistToMusicArtist(a))
  }

  async getRelatedHubs(itemId: string): Promise<MusicHub[]> {
    // Try to build hubs from the artist's top tracks + related artists
    const numId = dzId(itemId)
    const hubs: MusicHub[] = []

    try {
      const top = await api.getArtistTop(numId, 10)
      if (top.data?.length) {
        hubs.push({
          title: "Popular Tracks",
          identifier: "demo.related.top",
          items: top.data.map(t => ({
            ...enrichTrack(dzTrackToMusicTrack(t)),
            type: "track" as const,
          })),
          style: null,
        })
      }
    } catch { /* not an artist ID — that's fine */ }

    try {
      const related = await api.getArtistRelated(numId, 10)
      if (related.data?.length) {
        hubs.push({
          title: "Similar Artists",
          identifier: "demo.related.artists",
          items: related.data.map(a => ({
            ...dzArtistToMusicArtist(a),
            type: "artist" as const,
          })),
          style: null,
        })
      }
    } catch { /* ignore */ }

    return hubs
  }

  // ---------------------------------------------------------------------------
  // Playlists (local state)
  // ---------------------------------------------------------------------------

  async getPlaylists(): Promise<MusicPlaylist[]> {
    return state.getPlaylists().map(pl => ({
      id: pl.id,
      title: pl.title,
      smart: false,
      trackCount: pl.trackIds.length,
      duration: null,
      thumbUrl: null,
      summary: pl.summary || null,
      addedAt: pl.createdAt,
    }))
  }

  async getPlaylistItems(playlistId: string, offset?: number, limit?: number): Promise<PagedResult<MusicTrack>> {
    const pl = state.getPlaylist(playlistId)
    if (!pl) return { items: [], total: 0 }

    const start = offset ?? 0
    const end = limit ? start + limit : pl.trackIds.length
    const pageIds = pl.trackIds.slice(start, end)

    const tracks = await Promise.all(
      pageIds.map(id => this.getTrack(id))
    )

    return { items: tracks, total: pl.trackIds.length }
  }

  async createPlaylist(title: string, itemIds: string[]): Promise<MusicPlaylist> {
    const pl = state.createPlaylist(title, itemIds)
    return {
      id: pl.id,
      title: pl.title,
      smart: false,
      trackCount: pl.trackIds.length,
      duration: null,
      thumbUrl: null,
      summary: null,
      addedAt: pl.createdAt,
    }
  }

  async addToPlaylist(playlistId: string, itemIds: string[]): Promise<void> {
    state.addToPlaylist(playlistId, itemIds)
  }

  async deletePlaylist(playlistId: string): Promise<void> {
    state.deletePlaylist(playlistId)
  }

  async editPlaylist(playlistId: string, title?: string, summary?: string): Promise<void> {
    state.editPlaylist(playlistId, title, summary)
  }

  // ---------------------------------------------------------------------------
  // Liked (derived from ratings >= 8)
  // ---------------------------------------------------------------------------

  async getLikedTracks(): Promise<MusicTrack[]> {
    const likedIds = state.getLikedIds().filter(id => id.startsWith("dz-"))
    const tracks = await Promise.all(likedIds.map(id => this.getTrack(id).catch(() => null)))
    return tracks.filter((t): t is MusicTrack => t !== null)
  }

  async getLikedAlbums(): Promise<MusicAlbum[]> {
    // We don't track album ratings in the demo, return empty
    return []
  }

  async getLikedArtists(): Promise<MusicArtist[]> {
    // We don't track artist ratings in the demo, return empty
    return []
  }

  // ---------------------------------------------------------------------------
  // Playback
  // ---------------------------------------------------------------------------

  async getStreamUrl(track: MusicTrack): Promise<string> {
    const data = track._providerData as { preview?: string } | undefined
    if (!data?.preview) throw new Error("Track has no preview URL")
    return data.preview
  }

  async getPlaybackInfo(track: MusicTrack): Promise<TrackPlaybackInfo> {
    const url = await this.getStreamUrl(track)
    const data = track._providerData as { dzId?: number } | undefined
    return {
      url,
      trackKey: data?.dzId ?? 0,
      partId: 0,
      parentKey: "",
    }
  }

  async rate(itemId: string, rating: number | null): Promise<void> {
    state.setRating(itemId, rating)
  }

  async markPlayed(trackId: string): Promise<void> {
    state.incrementPlayCount(trackId)
  }

  async reportProgress(): Promise<void> {
    // no-op for demo
  }

  // ---------------------------------------------------------------------------
  // Tags (genres from Deezer)
  // ---------------------------------------------------------------------------

  async getTags(_tagType: string): Promise<{ tag: string; count: number | null }[]> {
    const result = await api.getGenres()
    return (result.data ?? [])
      .filter(g => g.id !== 0) // Deezer genre id=0 is "All"
      .map(g => ({ tag: g.name, count: null }))
  }

  async getItemsByTag(_tagType: string, tagName: string, _type?: string, limit?: number, offset?: number): Promise<PagedResult<MusicItem>> {
    // Find genre ID from name
    const genres = await api.getGenres()
    const genre = (genres.data ?? []).find(g => g.name.toLowerCase() === tagName.toLowerCase())
    if (!genre) return { items: [], total: 0 }

    const result = await api.getGenreArtists(genre.id, limit ?? 50)
    const items: MusicItem[] = (result.data ?? [])
      .slice(offset ?? 0)
      .map(a => ({ ...dzArtistToMusicArtist(a), type: "artist" as const }))

    return { items, total: result.total ?? items.length }
  }

  // ---------------------------------------------------------------------------
  // Now Playing (pass through to Plex commands — works for demo too)
  // ---------------------------------------------------------------------------

  async updateNowPlaying(title: string, artist: string, album: string, thumbPath: string | null, durationMs: number): Promise<void> {
    try {
      const { invoke } = await import("@tauri-apps/api/core")
      await invoke("update_now_playing", { title, artist, album, thumbPath, durationMs })
    } catch { /* ignore if not available */ }
  }

  async setNowPlayingState(nowPlayingState: "playing" | "paused" | "stopped", positionMs?: number): Promise<void> {
    try {
      const { invoke } = await import("@tauri-apps/api/core")
      await invoke("set_now_playing_state", { playbackState: nowPlayingState, positionMs })
    } catch { /* ignore if not available */ }
  }
}
