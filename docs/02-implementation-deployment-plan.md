# TeleBot Implementation and Deployment Plan

## 1. Environments

### 1.1 Development (Dev)

- **Runtime**: local Python/Node processes (backend via `manage.py runserver`, frontend via `npm run dev`).
- **Purpose**: feature work, prompt iteration, debugging.
- **Data**: synthetic test data + scraped Telesur documentation.
- **Model**: OpenAI `gpt-4o-mini` via API key (same model as production for consistent behavior).
- **Access**: `localhost:3000` (frontend), `localhost:8000` (API).

### 1.2 Production (Render)

- **Runtime**: Render Web Services (free tier).
  - Backend: Python runtime, Gunicorn with gevent workers.
  - Frontend: Node runtime, Next.js standalone server.
- **Infrastructure**:
  - MongoDB Atlas (free tier) for sessions, messages, telemetry, feedback.
  - ChromaDB on a 1 GB persistent Render disk for vector storage.
  - OpenAI API for LLM generation (`gpt-4o-mini`) and embeddings (`text-embedding-3-small`).
- **Build pipeline**: `build.sh` installs dependencies, runs collectstatic, migrates, scrapes Telesur website, and ingests documents into ChromaDB.
- **Access**: HTTPS via `*.onrender.com` subdomains with automatic TLS.

---

## 2. Deployment Steps

### Local Development

1. Clone repository.
2. Install backend: `cd backend && pip install -r requirements.txt`.
3. Install frontend: `cd frontend && npm ci`.
4. Copy `env.example` to `.env` and set `OPENAI_API_KEY` and `MONGO_URI`.
5. Run backend: `python manage.py runserver`.
6. Run frontend: `npm run dev`.
7. Validate: `GET /api/health`, `POST /api/chat`, `POST /api/feedback`, `GET /api/telemetry`.

### Production (Render)

**Option A: Render Blueprint (Recommended)**

1. Push repo to GitHub.
2. In Render Dashboard → **New** → **Blueprint**, connect your repo (`render.yaml` is auto-detected).
3. Set required env vars: `OPENAI_API_KEY`, `MONGO_URI`, `CORS_ALLOWED_ORIGINS`, `NEXT_PUBLIC_API_BASE_URL`.
4. Deploy.

**Option B: Manual Setup**

1. Create backend Web Service: Runtime=Python, Root=`backend`, Build=`./build.sh`, Start=`gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --worker-class gevent --workers 2 --timeout 180`.
2. Attach 1 GB disk at `/opt/render/project/src/chroma_data`.
3. Create frontend Web Service: Runtime=Node, Root=`frontend`, Build=`npm ci && npm run build`, Start=`node .next/standalone/server.js`.
4. Set environment variables per `render.yaml`.
5. Deploy both services.

Notes:

- Backend `build.sh` auto-scrapes the Telesur website and ingests docs into ChromaDB on every deploy.
- Render free tier has cold starts (~30s) after inactivity — first request may be slow.

---

## 3. Configuration Management

- All runtime values are env-driven (`.env`).
- No secrets are hardcoded in source files.
- Frontend container only receives `NEXT_PUBLIC_API_BASE_URL`.
- Environment variables determine behavior per environment:

| Variable               | Dev                    | Prod (Render)                     |
| ---------------------- | ---------------------- | --------------------------------- |
| `DEBUG`                | True                   | False (0)                         |
| `MONGO_DB_NAME`        | telesur_dev            | telesur_chatbot                   |
| `OPENAI_MODEL`         | gpt-4o-mini            | gpt-4o-mini                       |
| `OPENAI_EMBED_MODEL`   | text-embedding-3-small | text-embedding-3-small            |
| `ALLOWED_HOSTS`        | \*                     | .onrender.com                     |
| `CORS_ALLOWED_ORIGINS` | http://localhost:3000  | https://\<frontend\>.onrender.com |

---

## 4. Update Procedure

1. Pull latest source.
2. Review `.env` / `render.yaml` changes.
3. Push to GitHub — Render auto-deploys from the connected branch.
4. Monitor deploy logs in Render dashboard.
5. Validate health and chat behavior after deploy.

For manual deploys: trigger "Manual Deploy" → "Clear build cache & deploy" from the Render dashboard.

---

## 5. Rollback Strategy

1. Keep previous tagged release in VCS.
2. In Render dashboard, select a previous deploy and click "Rollback".
3. Alternatively: revert to previous tag/commit and push to trigger a new deploy.
4. Validate health and chat behavior.

---

## 6. Ownership

- **Engineering owner**: full-stack maintainers.
- **Data owner**: team responsible for service documentation in `/data`.
- **Ops owner**: monitors telemetry and container health.

---

## 7. Cost Estimation (Globale Kosteninschatting)

### 7.1 Local Development

| Component              | Cost                                |
| ---------------------- | ----------------------------------- |
| Python / Node.js       | $0 (open-source)                    |
| MongoDB Community      | $0 (local or Atlas free tier)       |
| ChromaDB               | $0 (runs in-process)                |
| OpenAI API (dev usage) | ~$0.50 / month (minimal during dev) |
| **Total**              | **~$0.50 / month**                  |

### 7.2 Production (Render)

| Component                                         | Monthly Cost (USD)        |
| ------------------------------------------------- | ------------------------- |
| Render Backend (free tier)                        | $0                        |
| Render Frontend (free tier)                       | $0                        |
| Render Persistent Disk (1 GB for ChromaDB)        | $0.25                     |
| MongoDB Atlas (M0 free tier, 512 MB)              | $0                        |
| OpenAI API (gpt-4o-mini + text-embedding-3-small) | $1 – $5 (low traffic)     |
| Domain name (optional)                            | ~$1 / month amortized     |
| **Total**                                         | **$1.25 – $6.25 / month** |

### 7.3 Why costs are low

- **Render free tier**: both backend and frontend run on free web services with no compute charges.
- **OpenAI `gpt-4o-mini`**: one of the cheapest production-quality models ($0.15 / 1M input tokens, $0.60 / 1M output tokens).
- **No managed vector DB**: ChromaDB runs on a Render persistent disk, avoiding Pinecone/Weaviate fees.
- **Small dataset**: Telesur documentation is < 1 MB, so storage costs are negligible.

### 7.4 Scaling cost considerations

If daily users exceed ~100 concurrent (Render free tier limit):

- Upgrade to Render Starter plan ($7/month per service).
- Move MongoDB to Atlas M2 shared ($9/month) for better performance.
- OpenAI costs scale linearly with usage (~$5–$50/month for moderate traffic).

---

## 8. Monitoring and Health Checks

- **Endpoint health**: `GET /api/health` returns 200 when MongoDB, ChromaDB, and OpenAI API key are reachable/configured.
- **Telemetry dashboard**: built-in `/monitor` page tracks response times, error rates, and feedback scores.
- **Render dashboard**: deploy logs, runtime logs, and service health visible in Render.
- **Alerting (recommended)**: add uptime check (e.g., UptimeRobot free tier) pinging `/api/health` every 5 minutes to detect Render cold-start issues.
