import json
import sqlite3
from datetime import UTC, datetime, timedelta
from pathlib import Path
import sys


BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / ".data"
DB_PATH = DATA_DIR / "tickets.db"
LEGACY_JSON_PATH = DATA_DIR / "tickets.json"


def configure_stdio():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")


def utc_now_iso():
    return datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def connect():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def table_exists(conn: sqlite3.Connection, table_name: str):
    row = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name = ?", (table_name,)
    ).fetchone()
    return row is not None


def column_exists(conn: sqlite3.Connection, table_name: str, column_name: str):
    rows = conn.execute(f"PRAGMA table_info({table_name})").fetchall()
    return any(r["name"] == column_name for r in rows)


def rebuild_ml_predictions_if_broken_fk(conn: sqlite3.Connection):
    if not table_exists(conn, "ml_predictions"):
        return

    fk_rows = conn.execute("PRAGMA foreign_key_list(ml_predictions)").fetchall()
    has_broken_fk = any(r[2] == "tickets_old" for r in fk_rows)
    if not has_broken_fk:
        return

    conn.execute("ALTER TABLE ml_predictions RENAME TO ml_predictions_old")
    conn.execute(
        """
        CREATE TABLE ml_predictions (
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
        )
        """
    )

    old_rows = conn.execute("SELECT * FROM ml_predictions_old").fetchall()
    old_cols = {r["name"] for r in conn.execute("PRAGMA table_info(ml_predictions_old)").fetchall()}

    for row in old_rows:
        data = dict(row)
        priority = data.get("priority") if "priority" in old_cols else data.get("predicted_priority")
        category = data.get("category") if "category" in old_cols else data.get("predicted_category")
        action = data.get("AzioniFatteInPassato")
        top5 = data.get("Top5") if "Top5" in old_cols else data.get("raw_top5_json")
        d_at = data.get("d_at") if "d_at" in old_cols else data.get("created_at")

        conn.execute(
            """
            INSERT INTO ml_predictions(
              id, ticket_id, model_name, model_version, priority, category, AzioniFatteInPassato, Top5, d_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                data.get("id"),
                data.get("ticket_id"),
                data.get("model_name") or "motore_ml",
                data.get("model_version") or "v1",
                priority,
                category,
                action,
                top5 if top5 is not None else "[]",
                d_at if d_at is not None else utc_now_iso(),
            ),
        )

    conn.execute("DROP TABLE ml_predictions_old")


def ensure_schema(conn: sqlite3.Connection):
    # Elimina tabelle non più richieste.
    conn.execute("DROP TABLE IF EXISTS ticket_events")
    conn.execute("DROP TABLE IF EXISTS user_groups")
    conn.execute("DROP TABLE IF EXISTS user_roles")
    conn.execute("DROP TABLE IF EXISTS roles")

    conn.executescript(
        """
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
          created_by_user_id INTEGER,
          assigned_group_id INTEGER,
          visibility_scope TEXT NOT NULL DEFAULT 'group',
          priority TEXT,
          category TEXT,
          AzioniFatteInPassato TEXT,
          Top5 TEXT,
          FOREIGN KEY (created_by_user_id) REFERENCES users(id),
          FOREIGN KEY (assigned_group_id) REFERENCES groups(id)
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
        """
    )

    rebuild_ml_predictions_if_broken_fk(conn)

    # Migrazione incrementale se il DB era già presente con vecchie colonne.
    if table_exists(conn, "users"):
        if not column_exists(conn, "users", "password"):
            conn.execute("ALTER TABLE users ADD COLUMN password TEXT NOT NULL DEFAULT 'changeme'")
        if not column_exists(conn, "users", "group_id"):
            conn.execute("ALTER TABLE users ADD COLUMN group_id INTEGER")
        if not column_exists(conn, "users", "is_super_admin"):
            conn.execute("ALTER TABLE users ADD COLUMN is_super_admin INTEGER NOT NULL DEFAULT 0")
        if not column_exists(conn, "users", "d_at"):
            conn.execute("ALTER TABLE users ADD COLUMN d_at TEXT")
            if column_exists(conn, "users", "created_at"):
                conn.execute("UPDATE users SET d_at = COALESCE(created_at, ?)", (utc_now_iso(),))
            else:
                conn.execute("UPDATE users SET d_at = COALESCE(d_at, ?)", (utc_now_iso(),))

    if table_exists(conn, "groups") and not column_exists(conn, "groups", "d_at"):
        conn.execute("ALTER TABLE groups ADD COLUMN d_at TEXT")
        if column_exists(conn, "groups", "created_at"):
            conn.execute("UPDATE groups SET d_at = COALESCE(created_at, ?)", (utc_now_iso(),))
        else:
            conn.execute("UPDATE groups SET d_at = COALESCE(d_at, ?)", (utc_now_iso(),))

    if table_exists(conn, "tickets"):
        if not column_exists(conn, "tickets", "d_at"):
            conn.execute("ALTER TABLE tickets ADD COLUMN d_at TEXT")
            if column_exists(conn, "tickets", "created_at"):
                conn.execute("UPDATE tickets SET d_at = COALESCE(created_at, ?)", (utc_now_iso(),))
            else:
                conn.execute("UPDATE tickets SET d_at = COALESCE(d_at, ?)", (utc_now_iso(),))
        if not column_exists(conn, "tickets", "priority"):
            conn.execute("ALTER TABLE tickets ADD COLUMN priority TEXT")
            if column_exists(conn, "tickets", "predicted_priority"):
                conn.execute("UPDATE tickets SET priority = predicted_priority WHERE priority IS NULL")
        if not column_exists(conn, "tickets", "category"):
            conn.execute("ALTER TABLE tickets ADD COLUMN category TEXT")
            if column_exists(conn, "tickets", "predicted_category"):
                conn.execute("UPDATE tickets SET category = predicted_category WHERE category IS NULL")
        if not column_exists(conn, "tickets", "AzioniFatteInPassato"):
            conn.execute("ALTER TABLE tickets ADD COLUMN AzioniFatteInPassato TEXT")
        if not column_exists(conn, "tickets", "Top5"):
            conn.execute("ALTER TABLE tickets ADD COLUMN Top5 TEXT")

    if table_exists(conn, "ml_predictions"):
        if not column_exists(conn, "ml_predictions", "priority"):
            conn.execute("ALTER TABLE ml_predictions ADD COLUMN priority TEXT")
            if column_exists(conn, "ml_predictions", "predicted_priority"):
                conn.execute(
                    "UPDATE ml_predictions SET priority = predicted_priority WHERE priority IS NULL"
                )
        if not column_exists(conn, "ml_predictions", "category"):
            conn.execute("ALTER TABLE ml_predictions ADD COLUMN category TEXT")
            if column_exists(conn, "ml_predictions", "predicted_category"):
                conn.execute(
                    "UPDATE ml_predictions SET category = predicted_category WHERE category IS NULL"
                )
        if not column_exists(conn, "ml_predictions", "AzioniFatteInPassato"):
            conn.execute("ALTER TABLE ml_predictions ADD COLUMN AzioniFatteInPassato TEXT")
        if not column_exists(conn, "ml_predictions", "Top5"):
            conn.execute("ALTER TABLE ml_predictions ADD COLUMN Top5 TEXT")
        if not column_exists(conn, "ml_predictions", "d_at"):
            conn.execute("ALTER TABLE ml_predictions ADD COLUMN d_at TEXT")
            if column_exists(conn, "ml_predictions", "created_at"):
                conn.execute("UPDATE ml_predictions SET d_at = COALESCE(created_at, ?)", (utc_now_iso(),))
            else:
                conn.execute("UPDATE ml_predictions SET d_at = COALESCE(d_at, ?)", (utc_now_iso(),))

    # Indici richiesti.
    conn.execute("DROP INDEX IF EXISTS idx_tickets_created_at")
    conn.execute("DROP INDEX IF EXISTS idx_ticket_events_ticket")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_tickets_d_at ON tickets(d_at)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_tickets_group ON tickets(assigned_group_id)")

    # Seed minimo.
    conn.execute(
        """
        INSERT OR IGNORE INTO groups(name, description, d_at)
        VALUES (?, ?, ?)
        """,
        ("DEFAULT_GROUP", "Gruppo di default", utc_now_iso()),
    )
    default_group_row = conn.execute(
        "SELECT id FROM groups WHERE name = ?",
        ("DEFAULT_GROUP",),
    ).fetchone()
    default_group_id = default_group_row["id"] if default_group_row else None
    conn.execute(
        """
        INSERT OR IGNORE INTO users(email, display_name, password, group_id, is_super_admin, is_active, d_at)
        VALUES (?, ?, ?, ?, 0, 1, ?)
        """,
        ("admin@local", "Admin", "admin", default_group_id, utc_now_iso()),
    )
    conn.execute(
        """
        INSERT OR IGNORE INTO users(email, display_name, password, group_id, is_super_admin, is_active, d_at)
        VALUES (?, ?, ?, NULL, 1, 1, ?)
        """,
        ("super_admin", "super_admin", "super_admin", utc_now_iso()),
    )


def maybe_migrate_legacy_json(conn: sqlite3.Connection):
    count = conn.execute("SELECT COUNT(*) AS c FROM tickets").fetchone()["c"]
    if count > 0 or not LEGACY_JSON_PATH.exists():
        return

    try:
        data = json.loads(LEGACY_JSON_PATH.read_text(encoding="utf-8"))
    except Exception:
        return

    for row in data:
        top5 = row.get("Top5")
        if isinstance(top5, list):
            top5 = json.dumps(top5, ensure_ascii=False)

        conn.execute(
            """
            INSERT OR IGNORE INTO tickets(
              id, description, status, d_at, priority, category, AzioniFatteInPassato, Top5
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                row.get("id"),
                row.get("description", ""),
                row.get("status", "open"),
                row.get("d_at") or row.get("created_at") or utc_now_iso(),
                row.get("priority") or row.get("predicted_priority"),
                row.get("category") or row.get("predicted_category"),
                row.get("AzioniFatteInPassato"),
                top5,
            ),
        )


def parse_top5(value):
    if not value:
        return []
    try:
        parsed = json.loads(value)
        return parsed if isinstance(parsed, list) else []
    except Exception:
        return []


def to_ticket_dict(row: sqlite3.Row):
    return {
        "id": row["id"],
        "description": row["description"],
        "status": row["status"],
        "created_at": row["d_at"],
        "priority": row["priority"],
        "category": row["category"],
        "AzioniFatteInPassato": row["AzioniFatteInPassato"],
        "Top5": parse_top5(row["Top5"]),
    }


def cmd_list_tickets(conn: sqlite3.Connection, payload=None):
    payload = payload or {}
    group_id = payload.get("group_id")
    if group_id is None:
        rows = conn.execute(
            """
            SELECT id, description, status, d_at, priority, category, AzioniFatteInPassato, Top5
            FROM tickets
            ORDER BY d_at DESC
            """
        ).fetchall()
    else:
        rows = conn.execute(
            """
            SELECT id, description, status, d_at, priority, category, AzioniFatteInPassato, Top5
            FROM tickets
            WHERE assigned_group_id = ?
            ORDER BY d_at DESC
            """,
            (group_id,),
        ).fetchall()
    return [to_ticket_dict(row) for row in rows]


def cmd_get_ticket(conn: sqlite3.Connection, payload):
    group_id = payload.get("group_id")
    if group_id is None:
        row = conn.execute(
            """
            SELECT id, description, status, d_at, priority, category, AzioniFatteInPassato, Top5
            FROM tickets
            WHERE id = ?
            """,
            (payload["id"],),
        ).fetchone()
    else:
        row = conn.execute(
            """
            SELECT id, description, status, d_at, priority, category, AzioniFatteInPassato, Top5
            FROM tickets
            WHERE id = ? AND assigned_group_id = ?
            """,
            (payload["id"], group_id),
        ).fetchone()
    return to_ticket_dict(row) if row else None


def cmd_create_ticket(conn: sqlite3.Connection, payload):
    ticket = payload["ticket"]
    ml_meta = payload.get("ml_meta") or {}
    top5_json = json.dumps(ticket.get("Top5") or [], ensure_ascii=False)

    conn.execute(
        """
        INSERT INTO tickets(
          id, description, status, d_at, created_by_user_id, assigned_group_id,
          visibility_scope, priority, category, AzioniFatteInPassato, Top5
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            ticket["id"],
            ticket["description"],
            ticket["status"],
            ticket["created_at"],
            ticket.get("created_by_user_id"),
            ticket.get("assigned_group_id"),
            ticket.get("visibility_scope", "group"),
            ticket.get("priority"),
            ticket.get("category"),
            ticket.get("AzioniFatteInPassato"),
            top5_json,
        ),
    )

    conn.execute(
        """
        INSERT INTO ml_predictions(
          ticket_id, model_name, model_version, priority, category, AzioniFatteInPassato, Top5, d_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            ticket["id"],
            ml_meta.get("model_name", "motore_ml"),
            ml_meta.get("model_version", "v1"),
            ticket.get("priority"),
            ticket.get("category"),
            ticket.get("AzioniFatteInPassato"),
            top5_json,
            ticket["created_at"],
        ),
    )

    row = conn.execute(
        """
        SELECT id, description, status, d_at, priority, category, AzioniFatteInPassato, Top5
        FROM tickets WHERE id = ?
        """,
        (ticket["id"],),
    ).fetchone()
    return to_ticket_dict(row)


def cmd_update_ticket_ml(conn: sqlite3.Connection, payload):
    ticket_id = payload["id"]
    top5 = payload.get("Top5")
    top5_json = json.dumps(top5, ensure_ascii=False) if top5 is not None else None

    conn.execute(
        """
        UPDATE tickets
        SET
          priority = COALESCE(?, priority),
          category = COALESCE(?, category),
          AzioniFatteInPassato = COALESCE(?, AzioniFatteInPassato),
          Top5 = COALESCE(?, Top5)
        WHERE id = ?
        """,
        (
            payload.get("priority"),
            payload.get("category"),
            payload.get("AzioniFatteInPassato"),
            top5_json,
            ticket_id,
        ),
    )

    row = conn.execute(
        """
        SELECT id, description, status, d_at, priority, category, AzioniFatteInPassato, Top5
        FROM tickets WHERE id = ?
        """,
        (ticket_id,),
    ).fetchone()
    return to_ticket_dict(row) if row else None


def cmd_dashboard_summary_filtered(conn: sqlite3.Connection, group_id):
    now = datetime.now(UTC)
    start = (now - timedelta(days=29)).date().isoformat()
    end = now.date().isoformat()

    if group_id is None:
        opened_count = conn.execute(
            "SELECT COUNT(*) AS c FROM tickets WHERE date(d_at) BETWEEN ? AND ?",
            (start, end),
        ).fetchone()["c"]
        open_now_count = conn.execute(
            "SELECT COUNT(*) AS c FROM tickets WHERE status IN ('open', 'in_progress')"
        ).fetchone()["c"]
        resolved_count = conn.execute(
            """
            SELECT COUNT(*) AS c
            FROM tickets
            WHERE status = 'resolved' AND date(d_at) BETWEEN ? AND ?
            """,
            (start, end),
        ).fetchone()["c"]
        closed_count = conn.execute(
            """
            SELECT COUNT(*) AS c
            FROM tickets
            WHERE status = 'closed' AND date(d_at) BETWEEN ? AND ?
            """,
            (start, end),
        ).fetchone()["c"]
    else:
        opened_count = conn.execute(
            "SELECT COUNT(*) AS c FROM tickets WHERE assigned_group_id = ? AND date(d_at) BETWEEN ? AND ?",
            (group_id, start, end),
        ).fetchone()["c"]
        open_now_count = conn.execute(
            "SELECT COUNT(*) AS c FROM tickets WHERE assigned_group_id = ? AND status IN ('open', 'in_progress')",
            (group_id,),
        ).fetchone()["c"]
        resolved_count = conn.execute(
            """
            SELECT COUNT(*) AS c
            FROM tickets
            WHERE assigned_group_id = ? AND status = 'resolved' AND date(d_at) BETWEEN ? AND ?
            """,
            (group_id, start, end),
        ).fetchone()["c"]
        closed_count = conn.execute(
            """
            SELECT COUNT(*) AS c
            FROM tickets
            WHERE assigned_group_id = ? AND status = 'closed' AND date(d_at) BETWEEN ? AND ?
            """,
            (group_id, start, end),
        ).fetchone()["c"]

    if group_id is None:
        trend_rows = conn.execute(
            """
            WITH RECURSIVE days(day) AS (
              SELECT date(?)
              UNION ALL
              SELECT date(day, '+1 day') FROM days WHERE day < date(?)
            )
            SELECT days.day AS date, COALESCE(t.c, 0) AS opened
            FROM days
            LEFT JOIN (
              SELECT date(d_at) AS d, COUNT(*) AS c
              FROM tickets
              GROUP BY date(d_at)
            ) t ON t.d = days.day
            ORDER BY days.day
            """,
            (start, end),
        ).fetchall()
    else:
        trend_rows = conn.execute(
            """
            WITH RECURSIVE days(day) AS (
              SELECT date(?)
              UNION ALL
              SELECT date(day, '+1 day') FROM days WHERE day < date(?)
            )
            SELECT days.day AS date, COALESCE(t.c, 0) AS opened
            FROM days
            LEFT JOIN (
              SELECT date(d_at) AS d, COUNT(*) AS c
              FROM tickets
              WHERE assigned_group_id = ?
              GROUP BY date(d_at)
            ) t ON t.d = days.day
            ORDER BY days.day
            """,
            (start, end, group_id),
        ).fetchall()

    if group_id is None:
        closed_trend_rows = conn.execute(
            """
            WITH RECURSIVE days(day) AS (
              SELECT date(?)
              UNION ALL
              SELECT date(day, '+1 day') FROM days WHERE day < date(?)
            )
            SELECT days.day AS date, COALESCE(t.c, 0) AS closed
            FROM days
            LEFT JOIN (
              SELECT date(d_at) AS d, COUNT(*) AS c
              FROM tickets
              WHERE status = 'closed'
              GROUP BY date(d_at)
            ) t ON t.d = days.day
            ORDER BY days.day
            """,
            (start, end),
        ).fetchall()
    else:
        closed_trend_rows = conn.execute(
            """
            WITH RECURSIVE days(day) AS (
              SELECT date(?)
              UNION ALL
              SELECT date(day, '+1 day') FROM days WHERE day < date(?)
            )
            SELECT days.day AS date, COALESCE(t.c, 0) AS closed
            FROM days
            LEFT JOIN (
              SELECT date(d_at) AS d, COUNT(*) AS c
              FROM tickets
              WHERE assigned_group_id = ? AND status = 'closed'
              GROUP BY date(d_at)
            ) t ON t.d = days.day
            ORDER BY days.day
            """,
            (start, end, group_id),
        ).fetchall()

    if group_id is None:
        by_category_rows = conn.execute(
            """
            SELECT COALESCE(category, 'unknown') AS category, COUNT(*) AS count
            FROM tickets
            WHERE date(d_at) BETWEEN ? AND ?
            GROUP BY COALESCE(category, 'unknown')
            ORDER BY count DESC
            """,
            (start, end),
        ).fetchall()
    else:
        by_category_rows = conn.execute(
            """
            SELECT COALESCE(category, 'unknown') AS category, COUNT(*) AS count
            FROM tickets
            WHERE assigned_group_id = ? AND date(d_at) BETWEEN ? AND ?
            GROUP BY COALESCE(category, 'unknown')
            ORDER BY count DESC
            """,
            (group_id, start, end),
        ).fetchall()

    if group_id is None:
        by_priority_rows = conn.execute(
            """
            SELECT COALESCE(priority, 'unknown') AS priority, COUNT(*) AS count
            FROM tickets
            WHERE date(d_at) BETWEEN ? AND ?
            GROUP BY COALESCE(priority, 'unknown')
            ORDER BY count DESC
            """,
            (start, end),
        ).fetchall()
    else:
        by_priority_rows = conn.execute(
            """
            SELECT COALESCE(priority, 'unknown') AS priority, COUNT(*) AS count
            FROM tickets
            WHERE assigned_group_id = ? AND date(d_at) BETWEEN ? AND ?
            GROUP BY COALESCE(priority, 'unknown')
            ORDER BY count DESC
            """,
            (group_id, start, end),
        ).fetchall()

    return {
        "last_30_days": {
            "opened_count": opened_count,
            "open_now_count": open_now_count,
            "resolved_count": resolved_count,
            "closed_count": closed_count,
        },
        "opened_trend": [{"date": r["date"], "opened": r["opened"]} for r in trend_rows],
        "closed_trend": [{"date": r["date"], "closed": r["closed"]} for r in closed_trend_rows],
        "by_category": [{"category": r["category"], "count": r["count"]} for r in by_category_rows],
        "by_priority": [{"priority": r["priority"], "count": r["count"]} for r in by_priority_rows],
    }


def cmd_dashboard_summary(conn: sqlite3.Connection, payload=None):
    payload = payload or {}
    group_id = payload.get("group_id")
    return cmd_dashboard_summary_filtered(conn, group_id)


def cmd_authenticate_user(conn: sqlite3.Connection, payload):
    row = conn.execute(
        """
        SELECT u.id, u.email, u.display_name, u.group_id, g.name AS group_name, u.is_super_admin, u.is_active
        FROM users u
        LEFT JOIN groups g ON g.id = u.group_id
        WHERE u.email = ? AND u.password = ? AND u.is_active = 1
        """,
        (payload["email"], payload["password"]),
    ).fetchone()
    return dict(row) if row else None


def cmd_get_user_by_id(conn: sqlite3.Connection, payload):
    row = conn.execute(
        """
        SELECT u.id, u.email, u.display_name, u.group_id, g.name AS group_name, u.is_super_admin, u.is_active
        FROM users u
        LEFT JOIN groups g ON g.id = u.group_id
        WHERE u.id = ? AND u.is_active = 1
        """,
        (payload["id"],),
    ).fetchone()
    return dict(row) if row else None


def cmd_get_group_id_by_name(conn: sqlite3.Connection, payload):
    row = conn.execute(
        "SELECT id FROM groups WHERE name = ?",
        (payload["name"],),
    ).fetchone()
    return row["id"] if row else None


COMMANDS = {
    "list_tickets": cmd_list_tickets,
    "get_ticket": cmd_get_ticket,
    "create_ticket": cmd_create_ticket,
    "update_ticket_ml": cmd_update_ticket_ml,
    "dashboard_summary": cmd_dashboard_summary,
    "authenticate_user": cmd_authenticate_user,
    "get_user_by_id": cmd_get_user_by_id,
    "get_group_id_by_name": cmd_get_group_id_by_name,
}


def main():
    configure_stdio()

    if len(sys.argv) < 2:
        raise SystemExit("Missing command")

    command = sys.argv[1]
    payload = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
    if command not in COMMANDS:
        raise SystemExit(f"Unsupported command: {command}")

    conn = connect()
    try:
        ensure_schema(conn)
        maybe_migrate_legacy_json(conn)
        result = COMMANDS[command](conn, payload) if payload else COMMANDS[command](conn)
        conn.commit()
    finally:
        conn.close()

    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
