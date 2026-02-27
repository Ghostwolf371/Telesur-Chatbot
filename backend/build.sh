#!/usr/bin/env bash
# Build script for Render deployment of the Django backend
set -o errexit

echo "==> Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "==> Collecting static files..."
python manage.py collectstatic --noinput

echo "==> Running database migrations..."
python manage.py migrate --noinput

echo "==> Ingesting RAG data into ChromaDB..."
python scripts/ingest_docs.py --data-dir ../data --reset || echo "Warning: RAG ingest failed, continuing..."

echo "==> Build complete!"
