#!/usr/bin/env python
from __future__ import annotations

import argparse
import csv
import os
from pathlib import Path

from pymongo import ASCENDING, MongoClient


def main() -> None:
    parser = argparse.ArgumentParser(description="Export TeleBot validation data for user-test reporting.")
    parser.add_argument("--output-dir", default="/tmp/telebot-validation", help="Directory to write CSV files")
    parser.add_argument("--limit-sessions", type=int, default=200, help="Max sessions to export")
    parser.add_argument(
        "--include-synthetic",
        action="store_true",
        help="Include synthetic smoke-check feedback rows",
    )
    args = parser.parse_args()

    mongo_uri = os.getenv("MONGO_URI", "mongodb://mongodb:27017")
    db_name = os.getenv("MONGO_DB_NAME", "telesur_chatbot")
    client = MongoClient(mongo_uri)
    db = client[db_name]
    sessions_col = db["sessions"]
    messages_col = db["messages"]
    telemetry_col = db["telemetry"]
    feedback_col = db["feedback"]

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    sessions_path = output_dir / "sessions.csv"
    messages_path = output_dir / "messages.csv"
    telemetry_path = output_dir / "telemetry.csv"
    feedback_path = output_dir / "feedback.csv"
    real_message_query = {"session_id": {"$not": {"$regex": r"^__smoke__"}}}
    feedback_query = {} if args.include_synthetic else {"is_synthetic": {"$ne": True}}

    sessions = list(
        sessions_col.find(real_message_query, {"_id": 0})
        .sort("updated_at", ASCENDING)
        .limit(args.limit_sessions)
    )

    with sessions_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["session_id", "user_id", "created_at", "updated_at", "summary"])
        for row in sessions:
            writer.writerow(
                [
                    row.get("session_id", ""),
                    row.get("user_id", ""),
                    row.get("created_at", ""),
                    row.get("updated_at", ""),
                    row.get("summary", ""),
                ]
            )

    with messages_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["session_id", "role", "content", "created_at"])
        cursor = messages_col.find(real_message_query, {"_id": 0}).sort("created_at", ASCENDING)
        for row in cursor:
            writer.writerow(
                [
                    row.get("session_id", ""),
                    row.get("role", ""),
                    row.get("content", ""),
                    row.get("created_at", ""),
                ]
            )

    with feedback_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(
            [
                "session_id",
                "tester_id",
                "rating",
                "success",
                "scenario",
                "notes",
                "is_synthetic",
                "created_at",
            ]
        )
        cursor = feedback_col.find(feedback_query, {"_id": 0}).sort("created_at", ASCENDING)
        for row in cursor:
            writer.writerow(
                [
                    row.get("session_id", ""),
                    row.get("tester_id", ""),
                    row.get("rating", ""),
                    row.get("success", ""),
                    row.get("scenario", ""),
                    row.get("notes", ""),
                    row.get("is_synthetic", False),
                    row.get("created_at", ""),
                ]
            )

    with telemetry_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["endpoint", "ttft_ms", "total_tokens_est", "status", "error_message", "created_at"])
        cursor = telemetry_col.find({}, {"_id": 0}).sort("created_at", ASCENDING)
        for row in cursor:
            writer.writerow(
                [
                    row.get("endpoint", ""),
                    row.get("ttft_ms", 0),
                    row.get("total_tokens_est", 0),
                    row.get("status", ""),
                    row.get("error_message", ""),
                    row.get("created_at", ""),
                ]
            )

    print(f"Export complete: {output_dir}")
    print(f"- {sessions_path}")
    print(f"- {messages_path}")
    print(f"- {telemetry_path}")
    print(f"- {feedback_path}")


if __name__ == "__main__":
    main()
