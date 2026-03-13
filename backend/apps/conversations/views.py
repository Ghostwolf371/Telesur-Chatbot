from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.conversations.serializers import (
    FeedbackCreateSerializer,
    FeedbackQuerySerializer,
    SummarizeRequestSerializer,
)
from apps.conversations.services.feedback_service import FeedbackService
from apps.conversations.services.history_service import HistoryService
from apps.conversations.services.summary_service import SummaryService


class HistoryView(APIView):
    def get(self, request, session_id: str) -> Response:
        history = HistoryService().get_history_payload(session_id=session_id)
        return Response(history, status=status.HTTP_200_OK)


class SummarizeView(APIView):
    throttle_scope = "summarize"

    def post(self, request) -> Response:
        serializer = SummarizeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session_id = serializer.validated_data["session_id"]
        force = serializer.validated_data.get("force", False)

        history_service = HistoryService()
        summary_service = SummaryService()

        count = history_service.count_user_messages(session_id=session_id)
        if not summary_service.should_refresh(count, force=force):
            summary = history_service.get_summary(session_id=session_id) or "No summary update needed."
        else:
            summary = summary_service.generate_and_store(
                session_id=session_id, history_service=history_service
            )

        session_doc = history_service.repository.get_session(session_id=session_id) or {}
        response = {
            "session_id": session_id,
            "summary": summary,
            "updated_at": session_doc.get("updated_at"),
        }
        return Response(response, status=status.HTTP_200_OK)


class FeedbackView(APIView):
    throttle_scope = "feedback"

    def post(self, request) -> Response:
        serializer = FeedbackCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        feedback = FeedbackService().save_feedback(
            session_id=serializer.validated_data["session_id"],
            tester_id=serializer.validated_data.get("tester_id"),
            rating=serializer.validated_data["rating"],
            success=serializer.validated_data["success"],
            is_synthetic=serializer.validated_data.get("is_synthetic", False),
            scenario=serializer.validated_data["scenario"],
            notes=serializer.validated_data.get("notes"),
            user_question=serializer.validated_data.get("user_question"),
            assistant_answer=serializer.validated_data.get("assistant_answer"),
        )
        return Response(feedback, status=status.HTTP_201_CREATED)

    def get(self, request) -> Response:
        query = FeedbackQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        service = FeedbackService()
        items = service.list_feedback(
            limit=query.validated_data.get("limit", 200),
            session_id=query.validated_data.get("session_id"),
            tester_id=query.validated_data.get("tester_id"),
            include_synthetic=query.validated_data.get("include_synthetic", False),
        )
        summary = service.summary()
        return Response({"items": items, "summary": summary}, status=status.HTTP_200_OK)
