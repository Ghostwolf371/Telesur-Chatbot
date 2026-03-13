# TeleBot — Telesur AI Klantenservice Assistent

🔗 **Live applicatie:** [https://telesur-chatbot.onrender.com](https://telesur-chatbot.onrender.com)

Productieklare AI-chatbot voor klantenondersteuning bij Telesur-diensten (Mobiel, Fiber, Entertainment).

## Projectgegevens

| Item | Details |
|------|---------|
| **Opleiding** | Software Engineering |
| **Docent** | Rwynn Christian |
| **Groepsleden** | Amar Sewdas (SE/1123/084), Rushil Ganpat (SE/1123/019), Chen Poun Joe Elton (SE/1123/013), Terrence Linger (SE/1123/037), Shantenoe Bissumbhar (SE/1123/011) |

## Technologieën

- **Frontend**: Next.js 14 (App Router, Tailwind CSS)
- **Backend**: Django 4.2 + Django REST Framework
- **Database**: MongoDB (via MongoDB Atlas free tier)
- **Vector DB**: ChromaDB (lokale persistente opslag)
- **AI**: OpenAI API (`gpt-4o-mini` + `text-embedding-3-small`)
- **Hosting**: Render

---

## 1. Vereisten

- [Node.js 20+](https://nodejs.org/)
- [Python 3.12+](https://python.org/)
- [MongoDB Atlas](https://www.mongodb.com/atlas) gratis cluster (of lokale MongoDB)
- [OpenAI API-sleutel](https://platform.openai.com/api-keys)

## 2. Lokale Ontwikkeling

### Backend

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt

# Kopieer en bewerk environment variables
cp ../env.example ../.env
# Bewerk ../.env met je OPENAI_API_KEY en MONGO_URI

# Database migraties
python manage.py migrate --noinput

# RAG data inladen
python scripts/ingest_docs.py --data-dir ../data --reset

# Start de server
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install

# Maak .env.local aan
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000" > .env.local
echo "NEXT_PUBLIC_SHOW_TEST_FEEDBACK_PANEL=1" >> .env.local

npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api

## 3. Deployment naar Render

### Optie A: Render Blueprint (Aanbevolen)

1. Push deze repository naar GitHub
2. Ga naar [Render Dashboard](https://dashboard.render.com/) → **New** → **Blueprint**
3. Verbind je repository, Render detecteert `render.yaml`
4. Stel de vereiste environment variables in:
   - `OPENAI_API_KEY` — je OpenAI API-sleutel
   - `MONGO_URI` — je MongoDB Atlas connectiestring
   - `CORS_ALLOWED_ORIGINS` — je frontend URL (bijv. `https://telesur-chatbot.onrender.com`)
   - `NEXT_PUBLIC_API_BASE_URL` — je backend URL (bijv. `https://telebot-backend.onrender.com`)
5. Deploy!

### Optie B: Handmatige Setup

**Backend (Web Service)**:
- Runtime: Python
- Root Directory: `backend`
- Build Command: `./build.sh`
- Start Command: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --worker-class gevent --workers 2 --timeout 180`
- Voeg een 1GB schijf toe op `/opt/render/project/src/chroma_data`

**Frontend (Web Service)**:
- Runtime: Node
- Root Directory: `frontend`
- Build Command: `npm ci && npm run build`
- Start Command: `node .next/standalone/server.js`

### Vereiste Environment Variables

| Variable | Service | Beschrijving |
|----------|---------|-------------|
| `OPENAI_API_KEY` | Backend | Je OpenAI API-sleutel |
| `OPENAI_MODEL` | Backend | Modelnaam (standaard: `gpt-4o-mini`) |
| `MONGO_URI` | Backend | MongoDB Atlas connectiestring |
| `SECRET_KEY` | Backend | Django secret key (auto-gegenereerd in blueprint) |
| `ALLOWED_HOSTS` | Backend | `.onrender.com` |
| `CORS_ALLOWED_ORIGINS` | Backend | Frontend URL |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend | Backend URL |

## 4. API Endpoints

| Methode | Route | Beschrijving |
|---------|-------|-------------|
| POST | `/api/chat` | Stuur een chatbericht |
| POST | `/api/chat/stream` | Stream chatantwoord (SSE) |
| GET | `/api/history/<session_id>` | Haal gespreksgeschiedenis op |
| POST | `/api/summarize` | Genereer gesprekssamenvatting |
| POST | `/api/feedback` | Feedback indienen |
| GET | `/api/feedback` | Feedbackitems ophalen |
| GET | `/api/telemetry` | Telemetry logs bekijken |
| GET | `/api/dashboard` | Volledig monitoring dashboard |
| GET | `/api/health` | Service health check |

## 5. RAG Data Beheer

Plaats brondocumenten (PDF/TXT/MD) in de `data/` map en laad ze in:

```bash
cd backend

# Telesur website scrapen
python scripts/scrape_telesur.py --base-url https://www.telesur.sr --max-pages 50

# Inladen in ChromaDB
python scripts/ingest_docs.py --reset
```

## 6. Environment Variable Referentie

**RAG auto-verversing:**
- `RAG_AUTO_REFRESH_ENABLED` (standaard `1`)
- `RAG_REFRESH_INTERVAL_MINUTES` (standaard `360`)
- `RAG_SCRAPE_BASE_URL` (standaard `https://www.telesur.sr`)
- `RAG_SCRAPE_MAX_PAGES` (standaard `50`)

**Geheugen en context:**
- `SUMMARY_TRIGGER_EVERY` (standaard `10` gebruikersbeurten)
- `TELEBOT_MEMORY_FETCH_LIMIT` (standaard `40`)
- `TELEBOT_PROMPT_RECENT_MESSAGES` (standaard `20`)
- `TELEBOT_PROMPT_RECENT_TOKENS` (standaard `1200`)

**Rate limits:**
- `CHAT_RATE_LIMIT` (standaard `30/min`)
- `SUMMARIZE_RATE_LIMIT` (standaard `20/min`)
- `FEEDBACK_RATE_LIMIT` (standaard `30/min`)

## 7. Projectdocumentatie

- [Architectuur Document](docs/Telebot-%20Architectuur%20Document.md)
- [Prompt Engineering Verslag](docs/Telebot-%20Prompt%20Engineerings%20verslag.md)
- [Gebruikerstest & Validatie](docs/Telebot-%20Gebruikerstest%20%26%20Validatie.md)
