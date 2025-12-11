from pathlib import Path
import sys

from sqlalchemy.engine.url import make_url

from app.core.config import get_settings
from app.db import Base, engine


def main() -> None:
    settings = get_settings()
    url = make_url(settings.database_url)

    if url.get_backend_name() != "sqlite":
        print(
            "This reset helper is only intended for SQLite development databases.\n"
            f"Current DATABASE_URL: {settings.database_url}"
        )
        sys.exit(1)

    db_path = Path(url.database or "")
    if not db_path.is_absolute():
        db_path = Path.cwd() / db_path

    print("\n=== DeployFlow Dev DB Reset (SQLite) ===")
    print(
        "This will DELETE the SQLite dev database file.\n"
        "Use only in development when schemas change and you see missing column errors."
    )
    print(f"Target file: {db_path}")

    if db_path.exists():
        db_path.unlink()
        print("Deleted existing database file.")
    else:
        print("No existing database file found; nothing to delete.")

    Base.metadata.create_all(bind=engine)
    print("Recreated tables using current SQLAlchemy models.\nDone.")


if __name__ == "__main__":
    main()
