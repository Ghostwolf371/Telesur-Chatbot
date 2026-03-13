# RAG Source Documents

Plaats hier je brondocumenten (PDF, TXT, MD) met kennis over Telesur-diensten voor de chatbot.

Tijdens deployment op Render genereert het `build.sh` script automatisch de file `telesur_site_scrape.md` in deze map door de website te scrapen, en laadt dit vervolgens in ChromaDB.

### Handmatig inladen (Lokaal)

Wanneer je lokaal ontwikkelt of bestanden toevoegt, laad je ze in via de backend:

```bash
cd backend
python scripts/ingest_docs.py --data-dir ../data --reset
```
