#!/bin/bash
set -e

# Change to trading-be directory for alembic
cd /app/trading-be

echo "Running migrations..."
alembic upgrade head

echo "Seeding default admin..."
python scripts/seed_admin.py

echo "Starting server (production)..."
# Run from /app — giống chạy: fastapi run trading-be/main.py --host 0.0.0.0
cd /app
exec fastapi run trading-be/main.py --host 0.0.0.0 --port 8000
