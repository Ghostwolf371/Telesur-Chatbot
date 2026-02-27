from __future__ import annotations

from typing import Any

from apps.conversations.repositories.mongo_repository import MongoRepository


class FeedbackService:
    def __init__(self, repository: MongoRepository | None = None) -> None:
        self.repository = repository or MongoRepository()

    def save_feedback(
        self,
        session_id: str,
        tester_id: str | None,
        rating: int,
        success: bool,
        is_synthetic: bool,
        scenario: str,
        notes: str | None = None,
    ) -> dict[str, Any]:
        payload = {
            "session_id": session_id,
            "tester_id": (tester_id or "").strip() or None,
            "rating": rating,
            "success": success,
            "is_synthetic": bool(is_synthetic),
            "scenario": scenario,
            "notes": (notes or "").strip(),
        }
        return self.repository.insert_feedback(payload)

    def list_feedback(
        self,
        limit: int = 200,
        session_id: str | None = None,
        tester_id: str | None = None,
        include_synthetic: bool = False,
    ) -> list[dict[str, Any]]:
        return self.repository.list_feedback(
            limit=limit,
            session_id=session_id,
            tester_id=tester_id,
            include_synthetic=include_synthetic,
        )

    def summary(self) -> dict[str, Any]:
        return self.repository.feedback_stats()
