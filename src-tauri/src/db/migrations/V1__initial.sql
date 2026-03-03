-- ===== SETTINGS =====
CREATE TABLE IF NOT EXISTS kv (
    key   TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
);

-- ===== ARTISTS =====
CREATE TABLE IF NOT EXISTS artists (
    id                 INTEGER PRIMARY KEY,  -- Plex ratingKey
    api_key            TEXT NOT NULL DEFAULT '',  -- Plex API path (/library/metadata/123)
    title              TEXT NOT NULL DEFAULT '',
    title_sort         TEXT,
    library_section_id INTEGER NOT NULL DEFAULT 0,
    album_sort         INTEGER NOT NULL DEFAULT 0,
    rating             REAL,
    thumb              TEXT,
    summary            TEXT,
    user_rating        REAL,
    added_at           TEXT,  -- ISO 8601
    last_viewed_at     TEXT,
    last_rated_at      TEXT,
    updated_at         TEXT,
    guid               TEXT,
    theme              TEXT,
    art                TEXT,
    json_extra         TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_artists_title ON artists(title COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_artists_title_sort ON artists(title_sort COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_artists_added_at ON artists(added_at);
CREATE INDEX IF NOT EXISTS idx_artists_guid ON artists(guid);

-- Artist locations (1:N — filesystem paths where their music lives)
CREATE TABLE IF NOT EXISTS artist_locations (
    artist_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    path      TEXT NOT NULL,
    PRIMARY KEY (artist_id, path)
);

-- ===== ALBUMS =====
CREATE TABLE IF NOT EXISTS albums (
    id                      INTEGER PRIMARY KEY,
    api_key                 TEXT NOT NULL DEFAULT '',
    title                   TEXT NOT NULL DEFAULT '',
    artist_id               INTEGER,
    artist_name             TEXT NOT NULL DEFAULT '',
    year                    INTEGER NOT NULL DEFAULT 0,
    library_section_id      INTEGER NOT NULL DEFAULT 0,
    track_count             INTEGER NOT NULL DEFAULT 0,
    played_track_count      INTEGER NOT NULL DEFAULT 0,
    studio                  TEXT,
    thumb                   TEXT,
    summary                 TEXT,
    user_rating             REAL,
    added_at                TEXT,
    last_viewed_at          TEXT,
    last_rated_at           TEXT,
    updated_at              TEXT,
    originally_available_at TEXT,
    guid                    TEXT,
    artist_guid             TEXT,
    artist_theme            TEXT,
    artist_thumb            TEXT,
    loudness_analysis_version INTEGER,
    json_extra              TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_albums_title ON albums(title COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_albums_artist_name ON albums(artist_name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_albums_artist_id ON albums(artist_id);
CREATE INDEX IF NOT EXISTS idx_albums_year ON albums(year);
CREATE INDEX IF NOT EXISTS idx_albums_added_at ON albums(added_at);
CREATE INDEX IF NOT EXISTS idx_albums_guid ON albums(guid);

-- Album reviews (1:N)
CREATE TABLE IF NOT EXISTS album_reviews (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    album_id   INTEGER NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
    review_id  INTEGER,
    tag        TEXT,
    text       TEXT,
    image      TEXT,
    link       TEXT,
    source     TEXT
);

CREATE INDEX IF NOT EXISTS idx_album_reviews_album ON album_reviews(album_id);

-- ===== TRACKS =====
CREATE TABLE IF NOT EXISTS tracks (
    id                    INTEGER PRIMARY KEY,
    api_key               TEXT NOT NULL DEFAULT '',
    title                 TEXT NOT NULL DEFAULT '',
    track_number          INTEGER NOT NULL DEFAULT 0,
    duration              INTEGER NOT NULL DEFAULT 0,  -- milliseconds
    album_id              INTEGER,
    album_name            TEXT NOT NULL DEFAULT '',
    album_year            INTEGER,
    album_studio          TEXT,
    artist_id             INTEGER,
    artist_name           TEXT NOT NULL DEFAULT '',
    library_section_id    INTEGER NOT NULL DEFAULT 0,
    library_section_key   TEXT,
    library_section_title TEXT,
    year                  INTEGER NOT NULL DEFAULT 0,
    play_count            INTEGER NOT NULL DEFAULT 0,
    thumb                 TEXT,
    album_thumb           TEXT,
    artist_thumb          TEXT,
    thumb_blur_hash       TEXT,
    summary               TEXT,
    user_rating           REAL,
    added_at              TEXT,
    last_viewed_at        TEXT,
    last_rated_at         TEXT,
    updated_at            TEXT,
    guid                  TEXT,
    audio_bitrate         INTEGER,
    audio_channels        REAL,
    audio_codec           TEXT,
    original_title        TEXT,
    primary_extra_key     TEXT,
    resume_offset         INTEGER,
    sonic_analysis_version INTEGER,
    rating_count          INTEGER,
    skip_count            INTEGER,
    json_extra            TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_tracks_title ON tracks(title COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_tracks_artist_name ON tracks(artist_name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_tracks_album_name ON tracks(album_name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_tracks_artist_id ON tracks(artist_id);
CREATE INDEX IF NOT EXISTS idx_tracks_album_id ON tracks(album_id);
CREATE INDEX IF NOT EXISTS idx_tracks_added_at ON tracks(added_at);
CREATE INDEX IF NOT EXISTS idx_tracks_guid ON tracks(guid);
CREATE INDEX IF NOT EXISTS idx_tracks_audio_codec ON tracks(audio_codec);
CREATE INDEX IF NOT EXISTS idx_tracks_year ON tracks(year);

-- Track media files (1:N per track — multiple versions/qualities)
CREATE TABLE IF NOT EXISTS media (
    id             INTEGER PRIMARY KEY,
    track_id       INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    duration       INTEGER,
    bitrate        INTEGER,
    audio_channels INTEGER,
    audio_codec    TEXT,
    container      TEXT
);

CREATE INDEX IF NOT EXISTS idx_media_track ON media(track_id);

-- Media parts (1:N per media — individual file parts)
CREATE TABLE IF NOT EXISTS media_parts (
    id            INTEGER PRIMARY KEY,
    media_id      INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    stream_key    TEXT NOT NULL DEFAULT '',
    duration      INTEGER,
    file_path     TEXT,
    file_size     INTEGER,
    container     TEXT,
    audio_profile TEXT
);

CREATE INDEX IF NOT EXISTS idx_media_parts_media ON media_parts(media_id);

-- Audio/video/subtitle streams (1:N per part — loudness analysis data lives here)
CREATE TABLE IF NOT EXISTS streams (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    part_id       INTEGER NOT NULL REFERENCES media_parts(id) ON DELETE CASCADE,
    stream_type   INTEGER,
    stream_key    TEXT,
    format        TEXT,
    gain          REAL,
    album_gain    REAL,
    peak          REAL,
    loudness      REAL,
    codec         TEXT,
    channels      INTEGER,
    bitrate       INTEGER,
    bit_depth     INTEGER,
    sampling_rate INTEGER,
    display_title TEXT,
    plex_stream_id INTEGER  -- original Plex stream ID (may be null)
);

CREATE INDEX IF NOT EXISTS idx_streams_part ON streams(part_id);

-- Track lyrics references (1:N per track)
CREATE TABLE IF NOT EXISTS lyrics (
    id        INTEGER PRIMARY KEY,
    track_id  INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    fetch_key TEXT NOT NULL DEFAULT '',
    format    TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_lyrics_track ON lyrics(track_id);

-- ===== PLAYLISTS =====
CREATE TABLE IF NOT EXISTS playlists (
    id                    INTEGER PRIMARY KEY,
    api_key               TEXT NOT NULL DEFAULT '',
    title                 TEXT NOT NULL DEFAULT '',
    title_sort            TEXT,
    playlist_type         TEXT NOT NULL DEFAULT '',
    smart                 INTEGER NOT NULL DEFAULT 0,
    radio                 INTEGER NOT NULL DEFAULT 0,
    track_count           INTEGER NOT NULL DEFAULT 0,
    duration              INTEGER,
    duration_seconds      INTEGER,
    library_section_id    INTEGER,
    library_section_key   TEXT,
    library_section_title TEXT,
    summary               TEXT,
    thumb                 TEXT,
    composite             TEXT,
    content               TEXT,
    icon                  TEXT,
    added_at              TEXT,
    updated_at            TEXT,
    guid                  TEXT,
    allow_sync            INTEGER NOT NULL DEFAULT 0,
    json_extra            TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_playlists_title ON playlists(title COLLATE NOCASE);

-- Playlist track membership (M:N with ordering)
CREATE TABLE IF NOT EXISTS playlist_tracks (
    playlist_id    INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    track_id       INTEGER NOT NULL,
    position       INTEGER NOT NULL,
    plex_item_id   INTEGER,
    added_at       TEXT NOT NULL,
    added_by       TEXT NOT NULL DEFAULT 'sync',
    PRIMARY KEY (playlist_id, position)
);

CREATE INDEX IF NOT EXISTS idx_playlist_tracks_track ON playlist_tracks(track_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_added ON playlist_tracks(added_at);

-- ===== TAGS (shared junction table for artists, albums, tracks) =====
CREATE TABLE IF NOT EXISTS tags (
    entity_type TEXT NOT NULL,
    entity_id   INTEGER NOT NULL,
    tag_type    TEXT NOT NULL,
    tag         TEXT NOT NULL,
    tag_id      INTEGER,
    filter      TEXT,
    PRIMARY KEY (entity_type, entity_id, tag_type, tag)
);

CREATE INDEX IF NOT EXISTS idx_tags_lookup ON tags(tag_type, tag);
CREATE INDEX IF NOT EXISTS idx_tags_entity ON tags(entity_type, entity_id);

-- ===== PLAY HISTORY =====
CREATE TABLE IF NOT EXISTS play_history (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    track_id    INTEGER NOT NULL,
    started_at  TEXT NOT NULL,
    duration_ms INTEGER NOT NULL,
    completed   INTEGER NOT NULL DEFAULT 0,
    source      TEXT
);

CREATE INDEX IF NOT EXISTS idx_play_history_track ON play_history(track_id);
CREATE INDEX IF NOT EXISTS idx_play_history_started ON play_history(started_at);
