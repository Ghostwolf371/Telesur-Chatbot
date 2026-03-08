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

echo "==> Scraping Telesur website for fresh RAG data..."
python scripts/scrape_telesur.py --base-url "${RAG_SCRAPE_BASE_URL:-https://www.telesur.sr}" --max-pages "${RAG_SCRAPE_MAX_PAGES:-50}" --output-md "${RAG_DATA_DIR:-../data}/telesur_site_scrape.md" || echo "Warning: Scrape failed, will ingest existing data..."

echo "==> Ingesting RAG data into ChromaDB..."
python scripts/ingest_docs.py --data-dir "${RAG_DATA_DIR:-../data}" --reset || echo "Warning: RAG ingest failed, continuing..."

echo "==> Build complete!"
