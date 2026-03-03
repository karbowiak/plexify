import { useLibraryStore } from "../../stores"
import { MediaCard } from "../MediaCard"
import { MediaGrid } from "../shared/MediaGrid"

export function Library() {
  const playlists = useLibraryStore(s => s.playlists)

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Your Library</h1>
      {playlists.length === 0 ? (
        <div className="text-sm text-gray-400">No playlists found.</div>
      ) : (
        <MediaGrid>
          {playlists.map(pl => (
            <MediaCard
              key={pl.id}
              title={pl.title}
              desc={`Playlist · ${pl.trackCount} songs`}
              thumb={pl.thumbUrl}
              href={`/playlist/${pl.id}`}
            />
          ))}
        </MediaGrid>
      )}
    </div>
  )
}
