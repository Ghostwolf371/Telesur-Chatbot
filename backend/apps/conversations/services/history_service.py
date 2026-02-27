from __future__ import annotations

from typing import Any

from apps.conversations.repositories.mongo_repository import MongoRepository


class HistoryService:
    def __init__(self, repository: MongoRepository | None = None) -> None:
        self.repository = repository or MongoRepository()

    def ensure_session(self, session_id: str, user_id: str | None = None) -> None:
        self.repository.ensure_session(session_id=session_id, user_id=user_id)

    def add_user_message(self, session_id: str, content: str) -> dict[str, Any]:
        return self.repository.add_message(session_id=session_id, role="user", content=content)

    def add_assistant_message(
        self, session_id: str, content: str, sources: list[dict[str, str]] | None = None
    ) -> dict[str, Any]:
        return self.repository.add_message(
            session_id=session_id,
            role="assistant",
            content=content,
            sources=sources or [],
        )

    def count_messages(self, session_id: str, role: str | None = None) -> int:
        return self.repository.count_messages(session_id=session_id, role=role)

    def count_user_messages(self, session_id: str) -> int:
        return self.repository.count_messages(session_id=session_id, role="user")

    def get_messages(self, session_id: str) -> list[dict[str, Any]]:
        return self.repository.get_messages(session_id=session_id)

    def get_recent_messages(self, session_id: str, limit: int = 8) -> list[dict[str, Any]]:
        return self.repository.get_recent_messages(session_id=session_id, limit=limit)

    def get_summary(self, session_id: str) -> str | None:
        session = self.repository.get_session(session_id=session_id) or {}
        return session.get("summary")

    def update_summary(self, session_id: str, summary: str) -> None:
        self.repository.update_summary(session_id=session_id, summary=summary)

    def get_history_payload(self, session_id: str) -> dict[str, Any]:
        session = self.repository.get_session(session_id=session_id) or {
            "session_id": session_id,
            "summary": None,
        }
        return {
            "session_id": session_id,
            "summary": session.get("summary"),
            "messages": self.repository.get_messages(session_id=session_id),
        }
