/**
 * SQLite client using better-sqlite3.
 * Initialises the schema on first run and provides a singleton connection.
 */
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_PATH = process.env.SQLITE_DB_PATH
  ? path.resolve(process.env.SQLITE_DB_PATH)
  : path.resolve('./data/kidsevents.db')

// Ensure data directory exists
const dbDir = path.dirname(DB_PATH)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH)
    _db.pragma('journal_mode = WAL')
    _db.pragma('foreign_keys = ON')
    initSchema(_db)
  }
  return _db
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      description TEXT NOT NULL,
      city        TEXT NOT NULL,
      venue       TEXT NOT NULL,
      date        TEXT NOT NULL,
      age_min     INTEGER NOT NULL DEFAULT 0,
      age_max     INTEGER NOT NULL DEFAULT 18,
      category    TEXT NOT NULL DEFAULT 'other',
      image_url   TEXT,
      ticket_url  TEXT,
      source      TEXT NOT NULL DEFAULT 'mock',
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_events_city      ON events(city);
    CREATE INDEX IF NOT EXISTS idx_events_date      ON events(date);
    CREATE INDEX IF NOT EXISTS idx_events_category  ON events(category);
    CREATE INDEX IF NOT EXISTS idx_events_city_date ON events(city, date);
  `)
}
