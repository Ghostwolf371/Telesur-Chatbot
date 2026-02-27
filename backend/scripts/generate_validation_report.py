#!/usr/bin/env python
from __future__ import annotations

import argparse
import os
from datetime import datetime, timezone
from pathlib import Path

from pymongo import MongoClient


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate a validation-summary markdown report from Mongo data.")
    parser.add_argument(
        "--output",
        default="/tmp/telebot-validation/validation-summary.md",
        help="Path to markdown output file",
    )
    args = parser.parse_args()

    mongo_uri = os.getenv("MONGO_URI", "mongodb://mongodb:27017")
    db_name = os.getenv("MONGO_DB_NAME", "telesur_chatbot")
    client = MongoClient(mongo_uri)
    db = client[db_name]

    feedback = db["feedback"]
    messages = db["messages"]
    telemetry = db["telemetry"]
    real_feedback_query = {"is_synthetic": {"$ne": True}}
    real_message_query = {"session_id": {"$not": {"$regex": r"^__smoke__"}}}

    total_feedback = feedback.count_documents(real_feedback_query)
    unique_testers = len(
        {
            t
            for t in feedback.distinct("tester_id", real_feedback_query)
            if isinstance(t, str) and t.strip()
        }
    )
    success_feedback = feedback.count_documents({"success": True, **real_feedback_query})
    success_rate = (success_feedback / total_feedback * 100.0) if total_feedback else 0.0

    rating_agg = list(
        feedback.aggregate(
            [
                {"$match": real_feedback_query},
                {"$group": {"_id": None, "avg": {"$avg": "$rating"}}},
            ]
        )
    )
    avg_rating = float(rating_agg[0]["avg"]) if rating_agg and rating_agg[0].get("avg") is not None else 0.0

    scenario_agg = list(
        feedback.aggregate(
            [
                {"$match": real_feedback_query},
                {"$group": {"_id": "$scenario", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}},
            ]
        )
    )

    user_msg_count = messages.count_documents({"role": "user", **real_message_query})
    session_agg = list(
        messages.aggregate(
            [
                {"$match": {"role": "user", **real_message_query}},
                {"$group": {"_id": "$session_id"}},
                {"$count": "sessions"},
            ]
        )
    )
    total_sessions = int(session_agg[0]["sessions"]) if session_agg else 0

    telemetry_agg = list(
        telemetry.aggregate(
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
    avg_ttft_ms = (
        float(telemetry_agg[0].get("avg_ttft_ms") or 0.0) if telemetry_agg else 0.0
    )
    avg_total_tokens = (
        float(telemetry_agg[0].get("avg_total_tokens_est") or 0.0) if telemetry_agg else 0.0
    )
    total_requests = telemetry.count_documents({})
    error_requests = telemetry.count_documents({"status": {"$ne": "ok"}})
    error_rate = (error_requests / total_requests * 100.0) if total_requests else 0.0

    generated_at = datetime.now(timezone.utc).isoformat()
    lines = [
        "# Validation Summary",
        "",
        f"Generated at: {generated_at}",
        "",
        "## User Testing Evidence",
        f"- Unique testers: {unique_testers}",
        f"- Total feedback entries: {total_feedback}",
        f"- Success-labeled feedback: {success_feedback}",
        f"- Success rate: {success_rate:.2f}%",
        f"- Average rating: {avg_rating:.2f}/5",
        "",
        "## Conversation Activity",
        f"- Sessions with user messages: {total_sessions}",
        f"- Total user messages: {user_msg_count}",
        "",
        "## Telemetry",
        f"- Total tracked requests: {total_requests}",
        f"- Error requests: {error_requests}",
        f"- Error rate: {error_rate:.2f}%",
        f"- Average TTFT: {avg_ttft_ms:.2f} ms",
        f"- Average token estimate: {avg_total_tokens:.2f}",
        "",
        "## Scenario Breakdown",
    ]
    if scenario_agg:
        for row in scenario_agg:
            scenario = row.get("_id") or "unknown"
            count = int(row.get("count") or 0)
            lines.append(f"- {scenario}: {count}")
    else:
        lines.append("- No feedback scenarios recorded yet.")

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Validation summary written: {output_path}")


if __name__ == "__main__":
    main()
