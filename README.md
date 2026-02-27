# TeleBot — Telesur AI Support Assistant

Production-ready AI customer support chatbot for Telesur services.

- **Frontend**: Next.js 14 (App Router, Tailwind CSS)
- **Backend**: Django 4.2 + Django REST Framework
- **Database**: MongoDB (via MongoDB Atlas free tier)
- **Vector DB**: ChromaDB (local persistent storage)
- **AI**: OpenAI API (`gpt-4o-mini` + `text-embedding-3-small`)
- **Hosting**: Render

---

## 1. Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [Python 3.12+](https://python.org/)
- [MongoDB Atlas](https://www.mongodb.com/atlas) free cluster (or local MongoDB)
- [OpenAI API key](https://platform.openai.com/api-keys)

## 2. Local Development Setup

### Backend

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt

# Copy and edit environment variables
cp ../env.example ../.env
# Edit ../.env with your OPENAI_API_KEY and MONGO_URI

# Run migrations
python manage.py migrate --noinput

# Ingest RAG data
python scripts/ingest_docs.py --data-dir ../data --reset

# Start the dev server
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000" > .env.local
echo "NEXT_PUBLIC_SHOW_TEST_FEEDBACK_PANEL=1" >> .env.local

npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api

## 3. Deploy to Render

### Option A: Render Blueprint (Recommended)

1. Push this repo to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/) → **New** → **Blueprint**
3. Connect your repo, Render will detect `render.yaml`
4. Set the required environment variables:
   - `OPENAI_API_KEY` — your OpenAI API key
   - `MONGO_URI` — your MongoDB Atlas connection string
   - `CORS_ALLOWED_ORIGINS` — your frontend URL (e.g., `https://telebot-frontend.onrender.com`)
   - `NEXT_PUBLIC_API_BASE_URL` — your backend URL (e.g., `https://telebot-backend.onrender.com`)
5. Deploy!

### Option B: Manual Setup

**Backend (Web Service)**:
- Runtime: Python
- Root Directory: `backend`
- Build Command: `./build.sh`
- Start Command: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --worker-class gevent --workers 2 --timeout 180`
- Add a 1GB disk mounted at `/opt/render/project/src/chroma_data`

**Frontend (Web Service)**:
- Runtime: Node
- Root Directory: `frontend`
- Build Command: `npm ci && npm run build`
- Start Command: `node .next/standalone/server.js`

### Required Environment Variables

| Variable | Service | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | Backend | Your OpenAI API key |
| `OPENAI_MODEL` | Backend | Model name (default: `gpt-4o-mini`) |
| `MONGO_URI` | Backend | MongoDB Atlas connection string |
| `SECRET_KEY` | Backend | Django secret key (auto-generated in blueprint) |
| `ALLOWED_HOSTS` | Backend | `.onrender.com` |
| `CORS_ALLOWED_ORIGINS` | Backend | Frontend URL |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend | Backend URL |

## 4. API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/chat` | Send a chat message |
| POST | `/api/chat/stream` | Stream chat response (SSE) |
| GET | `/api/history/<session_id>` | Get conversation history |
| POST | `/api/summarize` | Generate conversation summary |
| POST | `/api/feedback` | Submit feedback |
| GET | `/api/feedback` | List feedback entries |
| GET | `/api/telemetry` | View telemetry logs |
| GET | `/api/dashboard` | Full monitoring dashboard data |
| GET | `/api/health` | Service health check |

## 5. RAG Data Management

Place source documents (PDF/TXT/MD) in the `data/` folder, then ingest:

```bash
cd backend

# Scrape Telesur website
python scripts/scrape_telesur.py --base-url https://www.telesur.sr --max-pages 50

# Ingest into ChromaDB
python scripts/ingest_docs.py --reset
```

## 6. Environment Variable Reference

**RAG auto-refresh controls**:
- `RAG_AUTO_REFRESH_ENABLED` (default `1`)
- `RAG_REFRESH_INTERVAL_MINUTES` (default `360`)
- `RAG_SCRAPE_BASE_URL` (default `https://www.telesur.sr`)
- `RAG_SCRAPE_MAX_PAGES` (default `50`)

**Memory and context controls**:
- `SUMMARY_TRIGGER_EVERY` (default `10` user turns)
- `TELEBOT_MEMORY_FETCH_LIMIT` (default `40`)
- `TELEBOT_PROMPT_RECENT_MESSAGES` (default `20`)
- `TELEBOT_PROMPT_RECENT_TOKENS` (default `1200`)

**Rate limits**:
- `CHAT_RATE_LIMIT` (default `30/min`)
- `SUMMARIZE_RATE_LIMIT` (default `20/min`)
- `FEEDBACK_RATE_LIMIT` (default `30/min`)

## 7. Project Documentation

- [docs/01-architecture.md](docs/01-architecture.md)
- [docs/02-implementation-deployment-plan.md](docs/02-implementation-deployment-plan.md)
- [docs/03-monitoring-evaluation.md](docs/03-monitoring-evaluation.md)
- [docs/04-security-privacy-analysis.md](docs/04-security-privacy-analysis.md)
- [docs/05-user-testing-validation.md](docs/05-user-testing-validation.md)
- [docs/06-prompt-engineering-report.md](docs/06-prompt-engineering-report.md)
