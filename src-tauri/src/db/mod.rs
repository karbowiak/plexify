//! Local SQLite database layer.
//!
//! Stores artists, albums, tracks, playlists, and metadata from Plex with
//! properly typed columns — enabling fast queries, local search, and
//! deduplication.

pub mod albums;
pub mod artists;
pub mod kv;
pub mod playlists;
pub mod schema;
pub mod tracks;

use std::path::Path;
use std::sync::Mutex;

use rusqlite::Connection;
use serde::Serialize;

/// Shared database state managed by Tauri.
pub struct DbState(pub Mutex<Connection>);

impl DbState {
    /// Open (or create) the database at `db_path`, configure WAL mode and
    /// foreign keys, then run any pending migrations.
    pub fn open(db_path: &Path) -> Result<Self, String> {
        let conn = Connection::open(db_path).map_err(|e| format!("Failed to open database: {e}"))?;
        conn.pragma_update(None, "journal_mode", "WAL")
            .map_err(|e| format!("Failed to set WAL mode: {e}"))?;
        conn.pragma_update(None, "foreign_keys", "ON")
            .map_err(|e| format!("Failed to enable foreign keys: {e}"))?;
        schema::run_migrations(&conn)?;
        Ok(Self(Mutex::new(conn)))
    }

    /// Open an in-memory database for testing.
    #[cfg(test)]
    pub fn open_in_memory() -> Result<Self, String> {
        let conn =
            Connection::open_in_memory().map_err(|e| format!("Failed to open in-memory db: {e}"))?;
        conn.pragma_update(None, "foreign_keys", "ON")
            .map_err(|e| format!("Failed to enable foreign keys: {e}"))?;
        schema::run_migrations(&conn)?;
        Ok(Self(Mutex::new(conn)))
    }
}

/// Database info returned by the `db_get_info` command.
#[derive(Debug, Serialize)]
pub struct DbInfo {
    pub artist_count: i64,
    pub album_count: i64,
    pub track_count: i64,
    pub playlist_count: i64,
    pub tag_count: i64,
    pub play_history_count: i64,
}

/// Helper: parse a Plex API path like "/library/metadata/12345" into the
/// trailing numeric ID, or return `None` if the path doesn't match.
pub fn parse_plex_id(path: &str) -> Option<i64> {
    path.rsplit('/').next().and_then(|s| s.parse().ok())
}

/// Convert an `Option<DateTime<Utc>>` to an ISO 8601 string or None.
pub fn datetime_to_iso(dt: &Option<chrono::DateTime<chrono::Utc>>) -> Option<String> {
    dt.map(|d| d.to_rfc3339())
}

/// Parse an ISO 8601 string back to `Option<DateTime<Utc>>`.
#[allow(dead_code)]
pub fn iso_to_datetime(s: &Option<String>) -> Option<chrono::DateTime<chrono::Utc>> {
    s.as_ref()
        .and_then(|s| chrono::DateTime::parse_from_rfc3339(s).ok())
        .map(|d| d.with_timezone(&chrono::Utc))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_plex_id() {
        assert_eq!(parse_plex_id("/library/metadata/12345"), Some(12345));
        assert_eq!(parse_plex_id("/library/metadata/42/children"), None);
        assert_eq!(parse_plex_id(""), None);
        assert_eq!(parse_plex_id("12345"), Some(12345));
    }

    #[test]
    fn test_open_in_memory() {
        let db = DbState::open_in_memory().expect("should open in-memory db");
        let conn = db.0.lock().unwrap();
        // Verify tables exist by running a count query
        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM artists", [], |r| r.get(0))
            .unwrap();
        assert_eq!(count, 0);
    }
}
