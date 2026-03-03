//! Key-value store backed by the `kv` table.

use rusqlite::Connection;

/// Get a value by key.
pub fn get(conn: &Connection, key: &str) -> Result<Option<String>, String> {
    conn.query_row("SELECT value FROM kv WHERE key = ?1", [key], |row| {
        row.get(0)
    })
    .optional()
    .map_err(|e| format!("kv get error: {e}"))
}

/// Set a key-value pair (upsert).
pub fn set(conn: &Connection, key: &str, value: &str) -> Result<(), String> {
    conn.execute(
        "INSERT INTO kv (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = ?2",
        [key, value],
    )
    .map_err(|e| format!("kv set error: {e}"))?;
    Ok(())
}

/// Delete a key.
#[allow(dead_code)]
pub fn delete(conn: &Connection, key: &str) -> Result<(), String> {
    conn.execute("DELETE FROM kv WHERE key = ?1", [key])
        .map_err(|e| format!("kv delete error: {e}"))?;
    Ok(())
}

/// rusqlite Optional helper — upstream trait is not re-exported cleanly.
trait Optional<T> {
    fn optional(self) -> Result<Option<T>, rusqlite::Error>;
}

impl<T> Optional<T> for Result<T, rusqlite::Error> {
    fn optional(self) -> Result<Option<T>, rusqlite::Error> {
        match self {
            Ok(v) => Ok(Some(v)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::DbState;

    #[test]
    fn test_kv_round_trip() {
        let db = DbState::open_in_memory().unwrap();
        let conn = db.0.lock().unwrap();

        assert_eq!(get(&conn, "test_key").unwrap(), None);
        set(&conn, "test_key", "hello").unwrap();
        assert_eq!(get(&conn, "test_key").unwrap(), Some("hello".into()));

        // Overwrite
        set(&conn, "test_key", "world").unwrap();
        assert_eq!(get(&conn, "test_key").unwrap(), Some("world".into()));

        // Delete
        delete(&conn, "test_key").unwrap();
        assert_eq!(get(&conn, "test_key").unwrap(), None);
    }
}
