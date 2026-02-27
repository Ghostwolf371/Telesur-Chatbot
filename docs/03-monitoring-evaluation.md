# TeleBot Monitoring and Evaluation Setup

## 1. Metrics Captured

Per request telemetry (`/api/chat`) stores:

- `endpoint`
- `ttft_ms` (time to first token proxy)
- `total_tokens_est`
- `status` (`ok`/`error`)
- `error_message`
- `created_at`

Non-chat API endpoints are also logged through middleware for latency/error visibility.

Abuse protection signals:

- HTTP `429` on throttled requests (DRF scoped rate limiting).

## 2. Monitoring Endpoint

`GET /api/telemetry` returns:

- `items`: recent telemetry entries
- `summary`:
  - `total_requests`
  - `error_requests`
  - `error_rate`
  - `avg_ttft_ms`
  - `avg_total_tokens_est`

`GET /api/dashboard` returns a consolidated payload:

- `telemetry` summary
- `feedback` summary
- `conversations` summary
- `validation`:
  - `required` thresholds
  - `current` progress
  - `ready` boolean

`GET /api/feedback` returns:

- `items`: saved tester feedback entries
- `summary`:
  - `total_feedback`
  - `unique_testers`
  - `success_rate`
  - `avg_rating`
  - `by_scenario`

## 3. Example Operational Checks

1. Error trend: confirm `error_rate` stays near zero.
2. Latency trend: monitor `avg_ttft_ms`.
3. Token trend: monitor `avg_total_tokens_est` for prompt-size regressions.
4. Chat quality spot checks with retrieved `sources`.
5. Abuse trend: monitor frequency of `429` responses in API logs.
6. User satisfaction trend: monitor `avg_rating` and `success_rate` from feedback summary.

## 4. Evaluation Loop

1. Export telemetry snapshot (daily/weekly).
2. Identify latency spikes and failed interactions.
3. Inspect problematic sessions via `GET /api/history/<session_id>`.
4. Improve prompts, retrieval corpus, or guardrail patterns.
5. Re-run smoke and user tests.

## 5. Example API Responses

### `GET /api/health`

```json
{
  "status": "healthy",
  "checks": {
    "mongo": true,
    "chroma": true,
    "ollama": true
  }
}
```

### `GET /api/dashboard` (excerpt)

```json
{
  "telemetry": {
    "total_requests": 147,
    "error_requests": 2,
    "error_rate": 0.014,
    "avg_ttft_ms": 3420.5,
    "avg_total_tokens_est": 285
  },
  "conversations": {
    "total_sessions": 12,
    "sessions_with_user_messages": 10,
    "total_user_messages": 87,
    "total_messages": 174
  },
  "feedback": {
    "total_feedback": 18,
    "unique_testers": 3,
    "avg_rating": 3.9,
    "success_rate": 0.78
  },
  "validation": {
    "required": { "testers": 3, "conversations": 20, "feedback": 20 },
    "current": { "testers": 3, "conversations": 30, "feedback": 18 },
    "ready": false
  }
}
```

### `GET /api/telemetry` entry (single item)

```json
{
  "endpoint": "/api/chat",
  "ttft_ms": 2810,
  "total_tokens_est": 245,
  "status": "ok",
  "error_message": null,
  "created_at": "2026-02-18T14:22:03.412Z"
}
```

### `GET /api/feedback` entry (single item)

```json
{
  "session_id": "abc123",
  "scenario": "S01_pricing",
  "rating": 4,
  "success": true,
  "notes": "Correct price given for fiber 100",
  "tester_id": "tester_A",
  "created_at": "2026-02-18T14:25:11.000Z"
}
```

## 6. Current Baseline (from local smoke run)

- Health endpoint reports all dependencies up (`mongo`, `chroma`, `ollama` all `true`).
- Guardrail probes return deterministic refusal message on injection attempts.
- Summary refresh occurs after each 5 stored messages.
- RAG returns source attributions from indexed docs.

**Baseline metrics (local Docker, CPU-only Ollama):**

| Metric                      | Value      | Notes                              |
| --------------------------- | ---------- | ---------------------------------- |
| Avg response latency (TTFT) | ~3-5 s     | CPU inference, llama3.2:3b         |
| Avg tokens generated        | ~150-250   | `num_predict` capped at 150        |
| Error rate                  | < 2%       | Mostly timeout on cold model start |
| Guardrail block rate        | 100%       | All 4 regex patterns tested        |
| Feedback avg rating         | ~3.5-4.0/5 | From initial smoke testing         |
| Rate limit triggers         | 0          | Within 30 req/min threshold        |

**Improvement actions from baseline:**

1. Cold-start latency reduced by adding model warm-up on container startup (`ensure_ollama_model.py`).
2. Response length reduced by lowering `num_predict` from 512 → 150 and compressing prompt by ~60%.
3. Added `keep_alive: 30m` to prevent model unloading between requests.
4. Switched to gevent workers + SSE streaming for perceived-latency improvement.
