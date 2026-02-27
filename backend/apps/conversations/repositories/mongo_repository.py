from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any

from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.errors import PyMongoError


class MongoRepository:
    _instance: MongoRepository | None = None

    def __new__(cls) -> MongoRepository:
        """Singleton: reuse the same MongoClient across all requests."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
        db_name = os.getenv("MONGO_DB_NAME", "telesur_chatbot")
        self._client = MongoClient(uri, serverSelectionTimeoutMS=2000)
        self._db = self._client[db_name]
        self._sessions = self._db["sessions"]
        self._messages = self._db["messages"]
        self._telemetry = self._db["telemetry"]
        self._feedback = self._db["feedback"]
        self._indexes_ready = False
        self._initialized = True

        self._ensure_indexes()

    def _ensure_indexes(self) -> None:
        if self._indexes_ready:
            return
        try:
            self._sessions.create_index([("session_id", ASCENDING)], unique=True)
            self._messages.create_index(
                [("session_id", ASCENDING), ("created_at", ASCENDING)]
            )
            self._telemetry.create_index([("created_at", DESCENDING)])
            self._feedback.create_index(
                [("session_id", ASCENDING), ("created_at", DESCENDING)]
            )
            self._feedback.create_index(
                [("tester_id", ASCENDING), ("created_at", DESCENDING)]
            )
            self._indexes_ready = True
        except PyMongoError:
            # Index creation should not block API availability during startup.
            self._indexes_ready = False

    def ping(self) -> bool:
        try:
            self._client.admin.command("ping")
            self._ensure_indexes()
            return True
        except PyMongoError:
            return False

    def ensure_session(self, session_id: str, user_id: str | None) -> None:
        now = datetime.now(timezone.utc)
        self._sessions.update_one(
            {"session_id": session_id},
            {
                "$setOnInsert": {
                    "session_id": session_id,
                    "created_at": now,
                    "summary": None,
                },
                "$set": {
                    "updated_at": now,
                    "user_id": user_id,
                },
            },
            upsert=True,
        )

    def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        sources: list[dict[str, str]] | None = None,
    ) -> dict[str, Any]:
        item = {
            "session_id": session_id,
            "role": role,
            "content": content,
            "sources": sources or [],
            "created_at": datetime.now(timezone.utc),
        }
        self._messages.insert_one(item)
        self._sessions.update_one(
            {"session_id": session_id},
            {"$set": {"updated_at": datetime.now(timezone.utc)}},
            upsert=True,
        )
        return item

    def count_messages(self, session_id: str, role: str | None = None) -> int:
        query: dict[str, Any] = {"session_id": session_id}
        if role:
            query["role"] = role
        return self._messages.count_documents(query)

    def get_messages(
        self, session_id: str, limit: int | None = None
    ) -> list[dict[str, Any]]:
        cursor = self._messages.find({"session_id": session_id}, {"_id": 0}).sort(
            "created_at", ASCENDING
        )
        if isinstance(limit, int) and limit > 0:
            cursor = cursor.limit(limit)
        rows = list(cursor)
        return rows

    def get_recent_messages(
        self, session_id: str, limit: int = 8
    ) -> list[dict[str, Any]]:
        rows = list(
            self._messages.find({"session_id": session_id}, {"_id": 0})
            .sort("created_at", DESCENDING)
            .limit(max(1, limit))
        )
        rows.reverse()
        return rows

    def get_session(self, session_id: str) -> dict[str, Any] | None:
        return self._sessions.find_one({"session_id": session_id}, {"_id": 0})

    def update_summary(self, session_id: str, summary: str) -> None:
        self._sessions.update_one(
            {"session_id": session_id},
            {
                "$set": {
                    "summary": summary,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
            upsert=True,
        )

    def insert_telemetry(self, payload: dict[str, Any]) -> None:
        data = dict(payload)
        data["created_at"] = datetime.now(timezone.utc)
        self._telemetry.insert_one(data)

    def list_telemetry(self, limit: int = 200) -> list[dict[str, Any]]:
        return list(
            self._telemetry.find({}, {"_id": 0})
            .sort("created_at", DESCENDING)
            .limit(limit)
        )

    def telemetry_stats(self) -> dict[str, float | int]:
        total_requests = self._telemetry.count_documents({})
        error_requests = self._telemetry.count_documents({"status": {"$ne": "ok"}})
        avg_ttft_ms = 0.0
        avg_total_tokens_est = 0.0

        aggregate = list(
            self._telemetry.aggregate(
                [
                    {
                        "$group": {
                            "_id": None,
                            "avg_ttft_ms": {"$avg": "$ttft_ms"},
                            "avg_total_tokens_est": {"$avg": "$total_tokens_est"},
                        }
                    }
                ]
            )
        )
        if aggregate:
            avg_ttft_ms = float(aggregate[0].get("avg_ttft_ms") or 0.0)
            avg_total_tokens_est = float(
                aggregate[0].get("avg_total_tokens_est") or 0.0
            )

        error_rate = (error_requests / total_requests) if total_requests else 0.0
        return {
            "total_requests": int(total_requests),
            "error_requests": int(error_requests),
            "error_rate": float(error_rate),
            "avg_ttft_ms": round(avg_ttft_ms, 2),
            "avg_total_tokens_est": round(avg_total_tokens_est, 2),
        }

    def insert_feedback(self, payload: dict[str, Any]) -> dict[str, Any]:
        item = dict(payload)
        item["created_at"] = datetime.now(timezone.utc)
        self._feedback.insert_one(item)
        item.pop("_id", None)
        return item

    def list_feedback(
        self,
        limit: int = 200,
        session_id: str | None = None,
        tester_id: str | None = None,
        include_synthetic: bool = False,
    ) -> list[dict[str, Any]]:
        query: dict[str, Any] = {}
        if session_id:
            query["session_id"] = session_id
        if tester_id:
            query["tester_id"] = tester_id
        if not include_synthetic:
            query["is_synthetic"] = {"$ne": True}
        return list(
            self._feedback.find(query, {"_id": 0})
            .sort("created_at", DESCENDING)
            .limit(limit)
        )

    def feedback_stats(self) -> dict[str, Any]:
        real_feedback_query = {"is_synthetic": {"$ne": True}}
        total_feedback = self._feedback.count_documents(real_feedback_query)
        success_feedback = self._feedback.count_documents(
            {"success": True, **real_feedback_query}
        )
        avg_rating = 0.0

        rating_agg = list(
            self._feedback.aggregate(
                [
                    {"$match": real_feedback_query},
                    {
                        "$group": {
                            "_id": None,
                            "avg_rating": {"$avg": "$rating"},
                        }
                    },
                ]
            )
        )
        if rating_agg:
            avg_rating = float(rating_agg[0].get("avg_rating") or 0.0)

        scenario_agg = list(
            self._feedback.aggregate(
                [
                    {"$match": real_feedback_query},
                    {"$group": {"_id": "$scenario", "count": {"$sum": 1}}},
                    {"$sort": {"count": -1}},
                ]
            )
        )
        by_scenario = [
            {
                "scenario": str(row.get("_id") or "unknown"),
                "count": int(row.get("count") or 0),
            }
            for row in scenario_agg
        ]

        unique_testers = len(
            {
                row
                for row in self._feedback.distinct("tester_id", real_feedback_query)
                if isinstance(row, str) and row.strip()
            }
        )
        success_rate = (success_feedback / total_feedback) if total_feedback else 0.0
        return {
            "total_feedback": int(total_feedback),
            "unique_testers": int(unique_testers),
            "success_feedback": int(success_feedback),
            "success_rate": round(float(success_rate), 4),
            "avg_rating": round(avg_rating, 2),
            "by_scenario": by_scenario,
        }

    def conversation_stats(self) -> dict[str, int]:
        real_query = {"session_id": {"$not": {"$regex": r"^__smoke__"}}}
        total_user_messages = self._messages.count_documents(
            {"role": "user", **real_query}
        )
        sessions_with_user_messages = len(
            self._messages.distinct("session_id", {"role": "user", **real_query})
        )
        total_messages = self._messages.count_documents(real_query)
        return {
            "total_messages": int(total_messages),
            "total_user_messages": int(total_user_messages),
            "sessions_with_user_messages": int(sessions_with_user_messages),
        }
