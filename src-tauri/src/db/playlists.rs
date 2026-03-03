//! Playlist CRUD operations + playlist_tracks membership.

use rusqlite::Connection;
use serde::Serialize;

use crate::plex::models::Playlist;

use super::datetime_to_iso;

/// Playlist row returned from the database.
#[derive(Debug, Clone, Serialize, Default)]
pub struct PlaylistRow {
    pub id: i64,
    pub api_key: String,
    pub title: String,
    pub title_sort: Option<String>,
    pub playlist_type: String,
    pub smart: bool,
    pub radio: bool,
    pub track_count: i64,
    pub duration: Option<i64>,
    pub duration_seconds: Option<i64>,
    pub library_section_id: Option<i64>,
    pub library_section_key: Option<String>,
    pub library_section_title: Option<String>,
    pub summary: Option<String>,
    pub thumb: Option<String>,
    pub composite: Option<String>,
    pub content: Option<String>,
    pub icon: Option<String>,
    pub added_at: Option<String>,
    pub updated_at: Option<String>,
    pub guid: Option<String>,
    pub allow_sync: bool,
}

/// A playlist ↔ track membership row.
#[derive(Debug, Clone, Serialize, Default)]
pub struct PlaylistTrackRow {
    pub playlist_id: i64,
    pub track_id: i64,
    pub position: i64,
    pub plex_item_id: Option<i64>,
    pub added_at: String,
    pub added_by: String,
}

/// Upsert a single playlist from Plex data.
pub fn upsert(conn: &Connection, pl: &Playlist) -> Result<(), String> {
    conn.execute(
        "INSERT INTO playlists (id, api_key, title, title_sort, playlist_type, smart, radio,
            track_count, duration, duration_seconds, library_section_id, library_section_key,
            library_section_title, summary, thumb, composite, content, icon, added_at,
            updated_at, guid, allow_sync)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20,?21,?22)
         ON CONFLICT(id) DO UPDATE SET
            api_key=?2, title=?3, title_sort=?4, playlist_type=?5, smart=?6, radio=?7,
            track_count=?8, duration=?9, duration_seconds=?10, library_section_id=?11,
            library_section_key=?12, library_section_title=?13, summary=?14, thumb=?15,
            composite=?16, content=?17, icon=?18, added_at=?19, updated_at=?20,
            guid=?21, allow_sync=?22",
        rusqlite::params![
            pl.rating_key,
            pl.key,
            pl.title,
            pl.title_sort,
            pl.playlist_type,
            pl.smart as i64,
            pl.radio as i64,
            pl.leaf_count,
            pl.duration,
            pl.duration_in_seconds,
            pl.library_section_id,
            pl.library_section_key,
            pl.library_section_title,
            pl.summary,
            pl.thumb,
            pl.composite,
            pl.content,
            pl.icon,
            datetime_to_iso(&pl.added_at),
            datetime_to_iso(&pl.updated_at),
            pl.guid,
            pl.allow_sync as i64,
        ],
    )
    .map_err(|e| format!("upsert playlist error: {e}"))?;

    Ok(())
}

/// Upsert many playlists in a single transaction.
pub fn upsert_bulk(conn: &Connection, playlists: &[Playlist]) -> Result<(), String> {
    let tx = conn
        .unchecked_transaction()
        .map_err(|e| format!("begin tx error: {e}"))?;
    for pl in playlists {
        upsert(&tx, pl)?;
    }
    tx.commit().map_err(|e| format!("commit error: {e}"))?;
    Ok(())
}

/// Get all playlists.
pub fn get_all(conn: &Connection) -> Result<Vec<PlaylistRow>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, api_key, title, title_sort, playlist_type, smart, radio,
                    track_count, duration, duration_seconds, library_section_id,
                    library_section_key, library_section_title, summary, thumb,
                    composite, content, icon, added_at, updated_at, guid, allow_sync
             FROM playlists
             ORDER BY title COLLATE NOCASE",
        )
        .map_err(|e| format!("prepare error: {e}"))?;

    let rows: Vec<PlaylistRow> = stmt
        .query_map([], |row| row_to_playlist(row))
        .map_err(|e| format!("query error: {e}"))?
        .filter_map(|r| r.ok())
        .collect();

    Ok(rows)
}

/// Add a track to a playlist at a given position.
pub fn add_track(
    conn: &Connection,
    playlist_id: i64,
    track_id: i64,
    position: i64,
    plex_item_id: Option<i64>,
    added_by: &str,
) -> Result<(), String> {
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO playlist_tracks (playlist_id, track_id, position, plex_item_id, added_at, added_by)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)
         ON CONFLICT(playlist_id, position) DO UPDATE SET
            track_id=?2, plex_item_id=?4, added_at=?5, added_by=?6",
        rusqlite::params![playlist_id, track_id, position, plex_item_id, now, added_by],
    )
    .map_err(|e| format!("add playlist track error: {e}"))?;
    Ok(())
}

/// Get all tracks in a playlist, ordered by position.
pub fn get_tracks(conn: &Connection, playlist_id: i64) -> Result<Vec<PlaylistTrackRow>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT playlist_id, track_id, position, plex_item_id, added_at, added_by
             FROM playlist_tracks
             WHERE playlist_id = ?1
             ORDER BY position",
        )
        .map_err(|e| format!("prepare error: {e}"))?;

    let rows: Vec<PlaylistTrackRow> = stmt
        .query_map([playlist_id], |row| {
            Ok(PlaylistTrackRow {
                playlist_id: row.get(0)?,
                track_id: row.get(1)?,
                position: row.get(2)?,
                plex_item_id: row.get(3)?,
                added_at: row.get(4)?,
                added_by: row.get(5)?,
            })
        })
        .map_err(|e| format!("query error: {e}"))?
        .filter_map(|r| r.ok())
        .collect();

    Ok(rows)
}

/// Count total playlists.
pub fn count(conn: &Connection) -> Result<i64, String> {
    conn.query_row("SELECT COUNT(*) FROM playlists", [], |r| r.get(0))
        .map_err(|e| format!("count error: {e}"))
}

// ---- Helpers ----

fn row_to_playlist(row: &rusqlite::Row<'_>) -> rusqlite::Result<PlaylistRow> {
    Ok(PlaylistRow {
        id: row.get(0)?,
        api_key: row.get(1)?,
        title: row.get(2)?,
        title_sort: row.get(3)?,
        playlist_type: row.get(4)?,
        smart: row.get::<_, i64>(5)? != 0,
        radio: row.get::<_, i64>(6)? != 0,
        track_count: row.get(7)?,
        duration: row.get(8)?,
        duration_seconds: row.get(9)?,
        library_section_id: row.get(10)?,
        library_section_key: row.get(11)?,
        library_section_title: row.get(12)?,
        summary: row.get(13)?,
        thumb: row.get(14)?,
        composite: row.get(15)?,
        content: row.get(16)?,
        icon: row.get(17)?,
        added_at: row.get(18)?,
        updated_at: row.get(19)?,
        guid: row.get(20)?,
        allow_sync: row.get::<_, i64>(21)? != 0,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::DbState;

    fn make_playlist(id: i64, title: &str) -> Playlist {
        Playlist {
            rating_key: id,
            key: format!("/playlists/{id}"),
            title: title.to_string(),
            playlist_type: "audio".to_string(),
            leaf_count: 10,
            ..Default::default()
        }
    }

    #[test]
    fn test_playlist_round_trip() {
        let db = DbState::open_in_memory().unwrap();
        let conn = db.0.lock().unwrap();

        upsert(&conn, &make_playlist(1, "My Playlist")).unwrap();

        let all = get_all(&conn).unwrap();
        assert_eq!(all.len(), 1);
        assert_eq!(all[0].title, "My Playlist");
        assert_eq!(all[0].track_count, 10);
        assert!(!all[0].smart);
    }

    #[test]
    fn test_playlist_bulk_upsert() {
        let db = DbState::open_in_memory().unwrap();
        let conn = db.0.lock().unwrap();

        let pls: Vec<Playlist> = (1..=5)
            .map(|i| make_playlist(i, &format!("Playlist {i}")))
            .collect();
        upsert_bulk(&conn, &pls).unwrap();
        assert_eq!(count(&conn).unwrap(), 5);
    }

    #[test]
    fn test_playlist_tracks() {
        let db = DbState::open_in_memory().unwrap();
        let conn = db.0.lock().unwrap();

        upsert(&conn, &make_playlist(1, "Test")).unwrap();

        add_track(&conn, 1, 100, 0, Some(5000), "sync").unwrap();
        add_track(&conn, 1, 200, 1, Some(5001), "sync").unwrap();
        add_track(&conn, 1, 300, 2, None, "client").unwrap();

        let tracks = get_tracks(&conn, 1).unwrap();
        assert_eq!(tracks.len(), 3);
        assert_eq!(tracks[0].track_id, 100);
        assert_eq!(tracks[0].position, 0);
        assert_eq!(tracks[0].added_by, "sync");
        assert_eq!(tracks[2].track_id, 300);
        assert_eq!(tracks[2].added_by, "client");
    }

    #[test]
    fn test_playlist_smart_radio_flags() {
        let db = DbState::open_in_memory().unwrap();
        let conn = db.0.lock().unwrap();

        let mut pl = make_playlist(10, "Smart Playlist");
        pl.smart = true;
        pl.radio = true;
        upsert(&conn, &pl).unwrap();

        let all = get_all(&conn).unwrap();
        assert!(all[0].smart);
        assert!(all[0].radio);
    }
}
