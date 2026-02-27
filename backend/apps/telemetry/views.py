from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

import os

from apps.conversations.repositories.mongo_repository import MongoRepository
from apps.conversations.services.feedback_service import FeedbackService
from apps.telemetry.services.telemetry_service import TelemetryService


class TelemetryListView(APIView):
    def get(self, request) -> Response:
        service = TelemetryService()
        items = service.list_logs(limit=200)
        summary = service.summary()
        return Response({"items": items, "summary": summary}, status=status.HTTP_200_OK)


class DashboardView(APIView):
    def get(self, request) -> Response:
        repository = MongoRepository()
        telemetry_summary = TelemetryService(repository=repository).summary()
        feedback_summary = FeedbackService(repository=repository).summary()
        conversations = repository.conversation_stats()

        min_testers = int(os.getenv("VALIDATION_MIN_TESTERS", "3"))
        min_conversations = int(os.getenv("VALIDATION_MIN_CONVERSATIONS", "20"))
        min_feedback = int(os.getenv("VALIDATION_MIN_FEEDBACK", "3"))
        validation = {
            "required": {
                "testers": min_testers,
                "conversations": min_conversations,
                "feedback_entries": min_feedback,
            },
            "current": {
                "testers": int(feedback_summary.get("unique_testers", 0)),
                "conversations": int(conversations.get("sessions_with_user_messages", 0)),
                "feedback_entries": int(feedback_summary.get("total_feedback", 0)),
            },
        }
        validation["remaining"] = {
            "testers": max(0, validation["required"]["testers"] - validation["current"]["testers"]),
            "conversations": max(
                0, validation["required"]["conversations"] - validation["current"]["conversations"]
            ),
            "feedback_entries": max(
                0, validation["required"]["feedback_entries"] - validation["current"]["feedback_entries"]
            ),
        }
        validation["ready"] = (
            validation["current"]["testers"] >= validation["required"]["testers"]
            and validation["current"]["conversations"] >= validation["required"]["conversations"]
            and validation["current"]["feedback_entries"] >= validation["required"]["feedback_entries"]
        )

        payload = {
            "telemetry": telemetry_summary,
            "feedback": feedback_summary,
            "conversations": conversations,
            "validation": validation,
        }
        return Response(payload, status=status.HTTP_200_OK)
