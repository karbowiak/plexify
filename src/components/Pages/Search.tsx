import { useEffect, useState } from "react"
import { useLocation } from "wouter"
import clsx from "clsx"
import { useSearchStore, useConnectionStore, buildPlexImageUrl } from "../../stores"
import { getSectionTags } from "../../lib/plex"
import type { LibraryTag, PlexMedia } from "../../types/plex"
import { MediaCard } from "../MediaCard"
import { prefetchArtist, prefetchAlbum } from "../../stores/metadataCache"

type MediaType = "artist" | "album" | "track" | "playlist"

const GROUP_ORDER: MediaType[] = ["artist", "album", "track", "playlist"]
const GROUP_LABELS: Record<MediaType, string> = {
  artist: "Artists",
  album: "Albums",
  track: "Tracks",
  playlist: "Playlists",
}

const BG_COLORS = [
  "bg-blue-700",
  "bg-blue-950",
  "bg-green-700",
  "bg-orange-700",
  "bg-orange-600",
  "bg-cyan-700",
  "bg-purple-700",
  "bg-pink-700",
  "bg-red-700",
  "bg-teal-700",
  "bg-indigo-700",
  "bg-yellow-700",
]

// Station types available as browse cards
const STATIONS = [
  { id: "library-radio", label: "Library Radio", isPlaceholder: false },
  { id: "deep-cuts-radio", label: "Deep Cuts Radio", isPlaceholder: false },
  { id: "time-travel-radio", label: "Time Travel Radio", isPlaceholder: false },
  { id: "random-album-radio", label: "Random Album Radio", isPlaceholder: false },
  { id: "genre-radio", label: "Genre Radio", isPlaceholder: false },
  { id: "style-radio", label: "Style Radio", isPlaceholder: false },
  { id: "mood-radio", label: "Mood Radio", isPlaceholder: false },
  { id: "decade-radio", label: "Decade Radio", isPlaceholder: false },
  { id: "artist-mix", label: "Artist Mix Builder", isPlaceholder: true },
  { id: "album-mix", label: "Album Mix Builder", isPlaceholder: true },
]

// Station icon (music note / radio wave)
function StationIcon() {
  return (
    <svg
      height="48" width="48" viewBox="0 0 24 24" fill="currentColor"
      className="absolute right-2 bottom-2 text-white/20"
    >
      <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6zm-2 16a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
    </svg>
  )
}

function groupByType(results: PlexMedia[]) {
  const groups: Record<MediaType, PlexMedia[]> = {
    artist: [],
    album: [],
    track: [],
    playlist: [],
  }
  for (const item of results) {
    if (item.type in groups) groups[item.type as MediaType].push(item)
  }
  return groups
}

function getInfo(item: PlexMedia, baseUrl: string, token: string) {
  switch (item.type) {
    case "artist":
      return {
        title: item.title,
        desc: "Artist",
        thumb: item.thumb ? buildPlexImageUrl(baseUrl, token, item.thumb) : null,
        isArtist: true,
        href: `/artist/${item.rating_key}`,
        ratingKey: item.rating_key,
        itemType: "artist" as const,
      }
    case "album":
      return {
        title: item.title,
        desc: item.parent_title,
        thumb: item.thumb ? buildPlexImageUrl(baseUrl, token, item.thumb) : null,
        isArtist: false,
        href: `/album/${item.rating_key}`,
        ratingKey: item.rating_key,
        itemType: "album" as const,
      }
    case "track":
      return {
        title: item.title,
        desc: `${item.grandparent_title} · ${item.parent_title}`,
        thumb: item.thumb ? buildPlexImageUrl(baseUrl, token, item.thumb) : null,
        isArtist: false,
        href: null,
        ratingKey: item.rating_key,
        itemType: "track" as const,
      }
    case "playlist":
      return {
        title: item.title,
        desc: "Playlist",
        thumb: item.composite ? buildPlexImageUrl(baseUrl, token, item.composite) : null,
        isArtist: false,
        href: `/playlist/${item.rating_key}`,
        ratingKey: item.rating_key,
        itemType: "playlist" as const,
      }
    default:
      return null
  }
}

export function Search() {
  const [, navigate] = useLocation()
  const { results, isSearching, query, setQuery } = useSearchStore()
  const { baseUrl, token, musicSectionId } = useConnectionStore()
  const [genres, setGenres] = useState<LibraryTag[]>([])

  const showResults = query.trim().length > 0
  const groups = groupByType(results)

  // Fetch genres from Plex when connected
  useEffect(() => {
    if (!musicSectionId) return
    getSectionTags(musicSectionId, "genre")
      .then(tags => setGenres(tags.sort((a, b) => a.tag.localeCompare(b.tag))))
      .catch(() => {/* silently ignore — genres are non-critical */})
  }, [musicSectionId])

  const handleGenreClick = (genre: string) => {
    setQuery(genre)
    navigate("/search")
  }

  const handleStationClick = (stationId: string, isPlaceholder: boolean) => {
    if (!isPlaceholder) {
      navigate(`/radio/${stationId}`)
    }
  }

  return (
    <div className="pb-32">
      {showResults ? (
        <div className="space-y-8">
          {isSearching && <div className="text-sm text-gray-400">Searching…</div>}
          {!isSearching && results.length === 0 && (
            <div className="text-sm text-gray-400">No results for "{query}"</div>
          )}
          {GROUP_ORDER.map(type => {
            const items = groups[type]
            if (!items || items.length === 0) return null
            return (
              <div key={type}>
                <div className="mb-3 text-xl font-bold">{GROUP_LABELS[type]}</div>
                <div className="grid grid-cols-4 gap-4 2xl:grid-cols-5">
                  {items.slice(0, 5).map((item, idx) => {
                    const info = getInfo(item, baseUrl, token)
                    if (!info) return null
                    const prefetch = info.itemType === "artist"
                      ? () => prefetchArtist(info.ratingKey, musicSectionId ?? 0)
                      : info.itemType === "album"
                        ? () => prefetchAlbum(info.ratingKey)
                        : undefined
                    return (
                      <MediaCard
                        key={idx}
                        title={info.title}
                        desc={info.desc}
                        thumb={info.thumb}
                        isArtist={info.isArtist}
                        href={info.href ?? undefined}
                        prefetch={prefetch}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-8">
          {/* PlexAmp Stations */}
          <div>
            <div className="mb-4 text-2xl font-bold">Stations</div>
            <div className="grid grid-cols-5 gap-3 2xl:grid-cols-6">
              {STATIONS.map((station, idx) => (
                <div
                  key={station.id}
                  onClick={() => handleStationClick(station.id, station.isPlaceholder)}
                  className={clsx(
                    "relative aspect-square overflow-hidden rounded-lg select-none",
                    "bg-[#2a1f5a]",
                    station.isPlaceholder
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer hover:brightness-110 transition-[filter]"
                  )}
                  style={{ background: STATION_BG_COLORS[idx % STATION_BG_COLORS.length] }}
                  title={station.isPlaceholder ? `${station.label} — coming soon` : station.label}
                >
                  <span className="line-clamp-2 p-3 text-sm font-bold leading-snug">
                    {station.label}
                  </span>
                  <StationIcon />
                </div>
              ))}
            </div>
          </div>

          {/* Genres from Plex library */}
          {genres.length > 0 && (
            <div>
              <div className="mb-4 text-2xl font-bold">Browse by Genre</div>
              <div className="grid grid-cols-5 gap-3 2xl:grid-cols-6">
                {genres.map((g, idx) => (
                  <div
                    key={g.tag}
                    onClick={() => handleGenreClick(g.tag)}
                    className={clsx(
                      "relative aspect-square cursor-pointer overflow-hidden rounded-lg select-none",
                      "hover:brightness-110 transition-[filter]",
                      BG_COLORS[idx % BG_COLORS.length]
                    )}
                  >
                    <span className="line-clamp-2 p-3 text-sm font-bold leading-snug">{g.tag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading state — genres not yet fetched */}
          {genres.length === 0 && musicSectionId && (
            <div>
              <div className="mb-4 text-2xl font-bold">Browse by Genre</div>
              <div className="text-sm text-gray-400">Loading genres…</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Dark palette for station cards (distinct from the genre palette)
const STATION_BG_COLORS = [
  "#1a3a5c",
  "#2d1b4e",
  "#1a4a3a",
  "#4a2d1a",
  "#4a1a2d",
  "#1a2d4a",
  "#3a1a4a",
  "#1a4a4a",
  "#4a3a1a",
  "#2d3a1a",
]
