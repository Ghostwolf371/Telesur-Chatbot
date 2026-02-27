# RAG Source Documents

Place Telesur service knowledge files here (PDF, TXT, MD) for ingestion into ChromaDB.

Examples:

- Mobile plan brochures
- Fiber internet plan sheets
- Entertainment package FAQs

Then run:

```bash
docker compose exec backend python scripts/scrape_telesur.py --base-url https://www.telesur.sr --max-pages 50 --output-md /data/telesur_site_scrape.md
docker compose exec backend python scripts/ingest_docs.py --data-dir /data --reset
```

Or run the combined refresh command:

```bash
./scripts/refresh_rag_now.sh
```
