-- Kids Event Finder — SQLite schema

CREATE TABLE IF NOT EXISTS events (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  city        TEXT NOT NULL,
  venue       TEXT NOT NULL,
  date        TEXT NOT NULL,           -- ISO 8601 datetime string
  age_min     INTEGER NOT NULL DEFAULT 0,
  age_max     INTEGER NOT NULL DEFAULT 18,
  category    TEXT NOT NULL DEFAULT 'other'
              CHECK (category IN ('sports','arts','education','outdoor','other')),
  image_url   TEXT,
  ticket_url  TEXT,
  source      TEXT NOT NULL DEFAULT 'mock',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_events_city     ON events(city);
CREATE INDEX IF NOT EXISTS idx_events_date     ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_city_date ON events(city, date);
