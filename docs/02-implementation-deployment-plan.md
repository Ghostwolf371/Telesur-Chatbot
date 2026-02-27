# TeleBot Implementation and Deployment Plan

## 1. Environments

### 1.1 Development (Dev)

- **Runtime**: local Docker Compose (`docker-compose.yml`).
- **Purpose**: feature work, prompt iteration, debugging.
- **Data**: synthetic test data + scraped Telesur documentation.
- **Model**: Ollama `llama3.2:3b` running locally inside the `ollama` container.
- **Access**: `localhost:3000` (frontend), `localhost:8000` (API).

### 1.2 Test / Staging

- **Runtime**: same Docker Compose stack deployed on a shared team server or CI runner.
- **Purpose**: integration testing, user acceptance testing, smoke checks.
- **Config differences**:
  - `DEBUG=False` in Django settings.
  - Separate MongoDB database name (`telesur_test`) to isolate test data.
  - Automated test scripts (`scripts/smoke_check.py`, `scripts/check_validation_thresholds.py`) run after deploy.
- **Data**: curated validation scenarios (10 predefined Q&A pairs per service category).

### 1.3 Production (Prod) — recommended next step

- **Runtime**: single Linux VM (e.g., DigitalOcean Droplet, Hetzner Cloud) or Kubernetes cluster.
- **Additions over dev**:
  - Reverse proxy (nginx/Caddy) with TLS termination.
  - Managed MongoDB Atlas (free tier or M2 shared).
  - Centralized logging (Loki or CloudWatch).
  - Auto-restart via `docker compose restart` cron or systemd.
- **Access**: public domain with HTTPS.

---

## 2. Deployment Steps (Local / Teacher Flow)

1. Clone repository.
2. Start stack: `docker compose up -d --build --remove-orphans`.
3. Wait for health: `docker compose ps`.
4. Validate:
   - `GET /api/health`
   - `POST /api/chat`
   - `POST /api/feedback`
   - `GET /api/telemetry`

Notes:

- `.env` is optional for first run; compose defaults allow one-command startup.
- Backend startup auto-pulls Ollama model and attempts document ingestion from `/data`.
- If you want custom config, copy `.env.example` to `.env` and edit values.

---

## 3. Configuration Management

- All runtime values are env-driven (`.env`).
- No secrets are hardcoded in source files.
- Frontend container only receives `NEXT_PUBLIC_API_BASE_URL`.
- Environment variables determine behavior per environment:

| Variable        | Dev                   | Test                | Prod                       |
| --------------- | --------------------- | ------------------- | -------------------------- |
| `DEBUG`         | True                  | False               | False                      |
| `MONGO_DB_NAME` | telesur_dev           | telesur_test        | telesur_prod               |
| `OLLAMA_MODEL`  | llama3.2:3b           | llama3.2:3b         | llama3.2:3b                |
| `ALLOWED_HOSTS` | \*                    | server IP           | domain.sr                  |
| `CORS_ORIGINS`  | http://localhost:3000 | http://staging:3000 | https://telebot.telesur.sr |

---

## 4. Update Procedure

1. Pull latest source.
2. Review `.env` changes.
3. Rebuild and restart:
   - `docker compose up -d --build --remove-orphans`
4. Re-run ingestion if documents changed.
5. Smoke test endpoints.

---

## 5. Rollback Strategy

1. Keep previous tagged release in VCS.
2. Revert to previous tag/commit.
3. Rebuild with same command.
4. Validate health and chat behavior.

---

## 6. Ownership

- **Engineering owner**: full-stack maintainers.
- **Data owner**: team responsible for service documentation in `/data`.
- **Ops owner**: monitors telemetry and container health.

---

## 7. Cost Estimation (Globale Kosteninschatting)

### 7.1 Local Development (current setup)

| Component              | Cost                                   |
| ---------------------- | -------------------------------------- |
| Docker Desktop         | $0 (free for education)                |
| Ollama LLM runtime     | $0 (open-source, runs on host CPU/GPU) |
| MongoDB Community      | $0 (Docker image)                      |
| ChromaDB               | $0 (Docker image)                      |
| Electricity / hardware | Existing student laptop/desktop        |
| **Total**              | **$0 / month**                         |

### 7.2 Cloud Production Estimate (single VM)

| Component                                             | Monthly Cost (USD)          |
| ----------------------------------------------------- | --------------------------- |
| Linux VM (4 vCPU, 8 GB RAM) — DigitalOcean or Hetzner | $24 – $48                   |
| MongoDB Atlas (M2 shared, 2 GB storage)               | $0 – $9                     |
| Domain name (.sr or .com)                             | ~$1 / month amortized       |
| TLS certificate (Let's Encrypt)                       | $0                          |
| Ollama on same VM (no external API)                   | $0 (included in VM compute) |
| Backup storage (50 GB block)                          | $5                          |
| **Total**                                             | **$30 – $63 / month**       |

### 7.3 Why costs are low

- **No external LLM API fees**: Ollama runs locally, eliminating per-token charges (which would be $5–50/month for comparable OpenAI usage).
- **No managed vector DB**: ChromaDB runs in-process, avoiding Pinecone/Weaviate fees.
- **Small dataset**: Telesur documentation is <1 MB, so storage costs are negligible.

### 7.4 Scaling cost considerations

If daily users exceed ~500 concurrent:

- Upgrade VM to 8 vCPU / 16 GB RAM (+$40/month).
- Consider GPU instance for faster inference ($80–150/month for T4 GPU).
- Move MongoDB to dedicated Atlas cluster ($57/month for M10).

---

## 8. Monitoring and Health Checks

- **Endpoint health**: `GET /api/health` returns 200 when all services are reachable.
- **Container health**: Docker Compose healthchecks on MongoDB, Ollama, and backend containers.
- **Telemetry dashboard**: built-in `/monitor` page tracks response times, error rates, and feedback scores.
- **Alerting (prod)**: recommended to add uptime check (e.g., UptimeRobot free tier) pinging `/api/health` every 5 minutes.
