PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  d_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  password TEXT NOT NULL,
  group_id INTEGER,
  is_super_admin INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  d_at TEXT NOT NULL,
  FOREIGN KEY (group_id) REFERENCES groups(id)
);

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  status TEXT NOT NULL,
  d_at TEXT NOT NULL,
  closed_at TEXT,
  created_by_user_id INTEGER,
  assigned_group_id INTEGER,
  assigned_user_id INTEGER,
  visibility_scope TEXT NOT NULL DEFAULT 'group',
  priority TEXT,
  category TEXT,
  closure_reason TEXT,
  AzioniFatteInPassato TEXT,
  Top5 TEXT,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id),
  FOREIGN KEY (assigned_group_id) REFERENCES groups(id),
  FOREIGN KEY (assigned_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS ml_predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT NOT NULL,
  model_name TEXT NOT NULL,
  model_version TEXT NOT NULL,
  priority TEXT,
  category TEXT,
  AzioniFatteInPassato TEXT,
  Top5 TEXT,
  d_at TEXT NOT NULL,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dashboard_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_date TEXT NOT NULL UNIQUE,
  opened_count INTEGER NOT NULL,
  open_now_count INTEGER NOT NULL,
  resolved_count INTEGER NOT NULL,
  payload_json TEXT NOT NULL,
  d_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tickets_d_at ON tickets(d_at);
CREATE INDEX IF NOT EXISTS idx_tickets_closed_at ON tickets(closed_at);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_group ON tickets(assigned_group_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_user ON tickets(assigned_user_id);
