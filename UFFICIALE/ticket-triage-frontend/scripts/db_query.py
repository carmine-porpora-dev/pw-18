import argparse
import sqlite3
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description="Esegui query SQL sul DB tickets.db")
    parser.add_argument(
        "--db",
        default=str(Path(__file__).resolve().parents[1] / ".data" / "tickets.db"),
        help="Path del database SQLite",
    )
    parser.add_argument(
        "--sql",
        required=True,
        help="Query SQL da eseguire. Usa apici doppi esterni in PowerShell.",
    )
    args = parser.parse_args()

    conn = sqlite3.connect(args.db)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    try:
        cur.execute(args.sql)

        if args.sql.lstrip().lower().startswith("select"):
            rows = cur.fetchall()
            print(f"Rows: {len(rows)}")
            for row in rows:
                print(dict(row))
        else:
            conn.commit()
            print(f"OK. Righe coinvolte: {cur.rowcount}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
