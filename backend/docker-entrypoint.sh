#!/bin/bash
set -e

echo "Starting AllAjnah Backend..."

echo "Waiting for database to be ready..."
python << END
import time
import sys
from sqlalchemy import create_engine, text
import os

max_retries = 30
retry_count = 0

while retry_count < max_retries:
    try:
        engine = create_engine(os.environ['DATABASE_URL'])
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("Database is ready!")
        sys.exit(0)
    except Exception as e:
        retry_count += 1
        print(f"Database not ready yet (attempt {retry_count}/{max_retries}). Waiting...")
        time.sleep(2)

print("Could not connect to database after maximum retries")
sys.exit(1)
END

echo "Running database migrations..."
alembic upgrade head

echo "Starting application server..."
exec "$@"
