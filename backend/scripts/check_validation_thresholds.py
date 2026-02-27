#!/usr/bin/env python
"""Check user-validation thresholds against collected Mongo data."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from apps.conversations.repositories.mongo_repository import MongoRepository


def main() -> int:
    parser = argparse.ArgumentParser(description="Check if user-testing thresholds are met.")
    parser.add_argument("--min-testers", type=int, default=3)
    parser.add_argument("--min-conversations", type=int, default=20)
    parser.add_argument("--min-user-messages", type=int, default=0)
    parser.add_argument("--min-feedback", type=int, default=3)
    parser.add_argument("--strict", action="store_true", help="Exit non-zero when thresholds are not met")
    args = parser.parse_args()

    repository = MongoRepository()
    feedback = repository.feedback_stats()
    conversations = repository.conversation_stats()

    unique_testers = int(feedback.get("unique_testers", 0))
    total_feedback = int(feedback.get("total_feedback", 0))
    total_user_messages = int(conversations.get("total_user_messages", 0))
    sessions_with_user_messages = int(conversations.get("sessions_with_user_messages", 0))

    testers_ok = unique_testers >= args.min_testers
    conversations_ok = sessions_with_user_messages >= args.min_conversations
    feedback_ok = total_feedback >= args.min_feedback
    messages_ok = total_user_messages >= args.min_user_messages
    all_ok = testers_ok and conversations_ok and feedback_ok and messages_ok

    print("Validation Threshold Check")
    print(f"- unique testers: {unique_testers} (required >= {args.min_testers}) -> {'OK' if testers_ok else 'NOT MET'}")
    print(
        f"- conversations: {sessions_with_user_messages} "
        f"(required >= {args.min_conversations}) -> {'OK' if conversations_ok else 'NOT MET'}"
    )
    print(f"- feedback entries: {total_feedback} (required >= {args.min_feedback}) -> {'OK' if feedback_ok else 'NOT MET'}")
    if args.min_user_messages > 0:
        print(
            f"- total user messages: {total_user_messages} "
            f"(required >= {args.min_user_messages}) -> {'OK' if messages_ok else 'NOT MET'}"
        )
    print(f"- overall: {'PASS' if all_ok else 'INCOMPLETE'}")

    if args.strict and not all_ok:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
