#!/usr/bin/env bash
# Build script for Render deployment of the Django backend
set -o errexit

# Ensure we're in the backend directory regardless of how this script is called
cd "$(dirname "${BASH_SOURCE[0]}")"
echo "==> Working directory: $(pwd)"

echo "==> Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "==> Collecting static files..."
python manage.py collectstatic --noinput

echo "==> Running database migrations..."
python manage.py migrate --noinput

DATA_DIR="${RAG_DATA_DIR:-$(pwd)/../data}"

echo "==> Scraping Telesur website for fresh RAG data..."
echo "    Target: ${RAG_SCRAPE_BASE_URL:-https://www.telesur.sr}"
echo "    Output: ${DATA_DIR}/telesur_site_scrape.md"

if python scripts/scrape_telesur.py \
    --base-url "${RAG_SCRAPE_BASE_URL:-https://www.telesur.sr}" \
    --max-pages "${RAG_SCRAPE_MAX_PAGES:-50}" \
    --output-md "${DATA_DIR}/telesur_site_scrape.md"; then
  echo "    Scrape succeeded."
else
  echo "    WARNING: Scrape failed (exit $?), will ingest existing data."
fi

echo "==> Ingesting RAG data into ChromaDB..."
echo "    Data dir: ${DATA_DIR}"
echo "    Chroma dir: ${CHROMA_PERSIST_DIR:-$(pwd)/chroma_data}"
if python scripts/ingest_docs.py --data-dir "${DATA_DIR}" --reset; then
  echo "    Ingest succeeded."
else
  echo "    WARNING: RAG ingest failed (exit $?), continuing."
fi

echo "==> Build complete!"
