# Future Work — SQLite Database Layer

Work deferred from the initial SQLite implementation. The foundation (artists, albums, tracks, playlists, tags, media chain, KV store, play history) is complete and tested.

## Migrate IndexedDB stores to SQLite

The frontend currently uses Zustand persist + IndexedDB for:
- `libraryStore` — playlists, recently added, hubs, liked tracks
- `lastfmMetadataStore` — Last.fm artist/album/track metadata cache
- `deezerMetadataStore` — Deezer artist/album metadata cache
- `searchStore` — search history

These should be migrated to read/write from the SQLite database via Tauri commands, removing the IndexedDB dependency for persistent data.

## Hubs, Recently Added, and Mixes Storage

Hub data (home screen recommendations), recently added items, and mix/station definitions are currently only cached in Zustand. Storing these in SQLite would enable:
- Instant startup with cached home screen
- Offline-capable hub browsing
- Historical tracking of what was recommended

## External Metadata Caches

Last.fm, Deezer, and iTunes metadata are cached in IndexedDB with TTL logic. Moving these to SQLite tables would:
- Unify all caching in one place
- Enable SQL queries across metadata sources
- Simplify TTL expiration with SQL DELETE

## Embeddings

Store vector embeddings for tracks/albums/artists to enable:
- Semantic search ("find something like X")
- Smart playlist generation based on audio similarity
- Recommendation engine using local data

## WebSocket Sync

Real-time sync between Plex server changes and the local database:
- Listen for Plex webhook events
- Incrementally update affected rows
- Push changes to the frontend via Tauri events

## Deduplication

Use the normalized database to detect and handle:
- Duplicate tracks (same title/artist/duration, different rating keys)
- Multiple media versions per track (pick best quality)
- Merged artist entries
