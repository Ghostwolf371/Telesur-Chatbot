from __future__ import annotations

from typing import Any

from apps.conversations.repositories.mongo_repository import MongoRepository


class TelemetryService:
    def __init__(self, repository: MongoRepository | None = None) -> None:
        self.repository = repository or MongoRepository()

    def log_request(
        self,
        endpoint: str,
        ttft_ms: int,
        total_tokens_est: int,
        status: str,
        error_message: str = "",
    ) -> None:
        payload: dict[str, Any] = {
            "endpoint": endpoint,
            "ttft_ms": ttft_ms,
            "total_tokens_est": total_tokens_est,
            "status": status,
            "error_message": error_message,
        }
        self.repository.insert_telemetry(payload)

    def list_logs(self, limit: int = 200) -> list[dict[str, Any]]:
        return self.repository.list_telemetry(limit=limit)

    def summary(self) -> dict[str, float | int]:
        return self.repository.telemetry_stats()
