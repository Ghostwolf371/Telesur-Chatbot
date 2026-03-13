import json
import os
import time
import uuid
import threading

from django.http import StreamingHttpResponse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.chat.serializers import ChatRequestSerializer
from apps.chat.services.guardrail_service import GuardrailService
from apps.chat.services.llm_service import LLMService
from apps.chat.services.rag_service import RagService
from apps.conversations.repositories.mongo_repository import MongoRepository
from apps.conversations.services.history_service import HistoryService
from apps.conversations.services.summary_service import SummaryService
from apps.telemetry.services.telemetry_service import TelemetryService


def _parse_chat_request(request):
    """Validate request and build the shared services used by both chat views."""
    serializer = ChatRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    session_id = serializer.validated_data.get("session_id") or str(uuid.uuid4())
    user_id = serializer.validated_data.get("user_id")
    user_message = serializer.validated_data["message"]

    history_service = HistoryService()
    summary_service = SummaryService()
    guardrail = GuardrailService()
    rag_service = RagService()
    llm_service = LLMService()
    telemetry = TelemetryService(repository=history_service.repository)

    try:
        memory_fetch_limit = max(10, int(os.getenv("TELEBOT_MEMORY_FETCH_LIMIT", "40")))
    except ValueError:
        memory_fetch_limit = 40

    return {
        "session_id": session_id,
        "user_id": user_id,
        "user_message": user_message,
        "history_service": history_service,
        "summary_service": summary_service,
        "guardrail": guardrail,
        "rag_service": rag_service,
        "llm_service": llm_service,
        "telemetry": telemetry,
        "memory_fetch_limit": memory_fetch_limit,
    }


class ChatView(APIView):
    throttle_scope = "chat"

    def post(self, request) -> Response:
        ctx = _parse_chat_request(request)
        session_id = ctx["session_id"]
        user_id = ctx["user_id"]
        user_message = ctx["user_message"]
        history_service = ctx["history_service"]
        summary_service = ctx["summary_service"]
        guardrail = ctx["guardrail"]
        rag_service = ctx["rag_service"]
        llm_service = ctx["llm_service"]
        telemetry = ctx["telemetry"]
        memory_fetch_limit = ctx["memory_fetch_limit"]

        started = time.perf_counter()
        status_text = "ok"
        error_message = ""

        try:
            history_service.ensure_session(session_id=session_id, user_id=user_id)
            previous_user_message_count = history_service.count_user_messages(
                session_id=session_id
            )
            history_service.add_user_message(
                session_id=session_id, content=user_message
            )
            recent_messages = history_service.get_recent_messages(
                session_id=session_id,
                limit=memory_fetch_limit,
            )

            if guardrail.is_blocked(user_message):
                assistant_message = guardrail.refusal_message
                sources = []
            elif guardrail.contains_pii(user_message):
                assistant_message = guardrail._pii_refusal
                sources = []
            else:
                retrieval_query = llm_service.build_retrieval_query(
                    user_message=user_message,
                    recent_messages=recent_messages,
                )
                context, sources = rag_service.retrieve_context(query=retrieval_query)
                summary = history_service.get_summary(session_id=session_id)
                assistant_message = llm_service.generate_reply(
                    user_message=user_message,
                    context=context,
                    summary=summary,
                    recent_messages=recent_messages,
                )

            history_service.add_assistant_message(
                session_id=session_id,
                content=assistant_message,
                sources=sources,
            )

            total_user_message_count = history_service.count_user_messages(
                session_id=session_id
            )
            if summary_service.should_refresh(
                message_count=total_user_message_count,
                previous_count=previous_user_message_count,
            ):
                # Run summary generation in a background thread to avoid
                # blocking the response.
                _run_summary_background(summary_service, session_id, history_service)

        except Exception as exc:  # pragma: no cover - scaffold safety
            status_text = "error"
            error_message = str(exc)
            assistant_message = (
                "I encountered a temporary problem. Please try again shortly."
            )
            sources = []

        elapsed_ms = int((time.perf_counter() - started) * 1000)
        total_tokens_est = llm_service.estimate_tokens(
            f"{user_message} {assistant_message}"
        )

        try:
            telemetry.log_request(
                endpoint="/api/chat",
                ttft_ms=elapsed_ms,
                total_tokens_est=total_tokens_est,
                status=status_text,
                error_message=error_message,
            )
        except Exception:
            pass

        payload = {
            "session_id": session_id,
            "assistant_message": assistant_message,
            "sources": sources,
            "telemetry": {
                "ttft_ms": elapsed_ms,
                "total_tokens_est": total_tokens_est,
            },
        }
        http_status = (
            status.HTTP_200_OK
            if status_text == "ok"
            else status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        return Response(payload, status=http_status)


def _run_summary_background(
    summary_service: SummaryService,
    session_id: str,
    history_service: HistoryService,
) -> None:
    """Fire-and-forget summary generation so it doesn't block the response."""

    def _work():
        try:
            summary_service.generate_and_store(
                session_id=session_id,
                history_service=history_service,
            )
        except Exception:
            pass

    t = threading.Thread(target=_work, daemon=True)
    t.start()


class ChatStreamView(APIView):
    """Server-Sent Events streaming endpoint for chat responses."""

    throttle_scope = "chat"

    def post(self, request):
        ctx = _parse_chat_request(request)
        session_id = ctx["session_id"]
        user_id = ctx["user_id"]
        user_message = ctx["user_message"]
        history_service = ctx["history_service"]
        summary_service = ctx["summary_service"]
        guardrail = ctx["guardrail"]
        rag_service = ctx["rag_service"]
        llm_service = ctx["llm_service"]
        telemetry = ctx["telemetry"]
        memory_fetch_limit = ctx["memory_fetch_limit"]

        # Pre-work: session, history, guardrail, RAG
        try:
            history_service.ensure_session(session_id=session_id, user_id=user_id)
            previous_user_message_count = history_service.count_user_messages(
                session_id=session_id
            )
            history_service.add_user_message(
                session_id=session_id, content=user_message
            )
            recent_messages = history_service.get_recent_messages(
                session_id=session_id,
                limit=memory_fetch_limit,
            )
        except Exception as exc:
            return Response(
                {"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        if guardrail.is_blocked(user_message):
            # Not worth streaming a single refusal sentence
            refusal = guardrail.refusal_message
            history_service.add_assistant_message(
                session_id=session_id, content=refusal, sources=[]
            )
            return Response(
                {
                    "session_id": session_id,
                    "assistant_message": refusal,
                    "sources": [],
                    "telemetry": {"ttft_ms": 0, "total_tokens_est": 0},
                }
            )

        if guardrail.contains_pii(user_message):
            pii_msg = guardrail._pii_refusal
            history_service.add_assistant_message(
                session_id=session_id, content=pii_msg, sources=[]
            )
            return Response(
                {
                    "session_id": session_id,
                    "assistant_message": pii_msg,
                    "sources": [],
                    "telemetry": {"ttft_ms": 0, "total_tokens_est": 0},
                }
            )

        retrieval_query = llm_service.build_retrieval_query(
            user_message=user_message,
            recent_messages=recent_messages,
        )
        context, sources = rag_service.retrieve_context(query=retrieval_query)
        summary = history_service.get_summary(session_id=session_id)

        started = time.perf_counter()

        def event_stream():
            full_text = ""
            try:
                # Send session_id + sources first
                meta = json.dumps(
                    {
                        "type": "meta",
                        "session_id": session_id,
                        "sources": sources,
                    }
                )
                yield f"data: {meta}\n\n"

                gen = llm_service.generate_reply_stream(
                    user_message=user_message,
                    context=context,
                    summary=summary,
                    recent_messages=recent_messages,
                )
                for token in gen:
                    full_text += token
                    data = json.dumps({"type": "token", "token": token})
                    yield f"data: {data}\n\n"

            except Exception:
                if not full_text:
                    full_text = (
                        "I encountered a temporary problem. Please try again shortly."
                    )
                    err = json.dumps({"type": "token", "token": full_text})
                    yield f"data: {err}\n\n"

            # Send done event
            elapsed_ms = int((time.perf_counter() - started) * 1000)
            tokens_est = llm_service.estimate_tokens(f"{user_message} {full_text}")
            done = json.dumps(
                {
                    "type": "done",
                    "telemetry": {
                        "ttft_ms": elapsed_ms,
                        "total_tokens_est": tokens_est,
                    },
                }
            )
            yield f"data: {done}\n\n"

            # Post-stream work: save message, telemetry, summary
            final_text = (
                full_text.strip()
                or "I encountered a temporary problem. Please try again shortly."
            )
            history_service.add_assistant_message(
                session_id=session_id,
                content=final_text,
                sources=sources,
            )
            try:
                telemetry.log_request(
                    endpoint="/api/chat/stream",
                    ttft_ms=elapsed_ms,
                    total_tokens_est=tokens_est,
                    status="ok",
                    error_message="",
                )
            except Exception:
                pass

            total_user_message_count = history_service.count_user_messages(
                session_id=session_id
            )
            if summary_service.should_refresh(
                message_count=total_user_message_count,
                previous_count=previous_user_message_count,
            ):
                _run_summary_background(summary_service, session_id, history_service)

        response = StreamingHttpResponse(
            event_stream(),
            content_type="text/event-stream",
        )
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        return response


class HealthView(APIView):
    def get(self, request) -> Response:
        services = {
            "mongo": "down",
            "chroma": "down",
            "openai": "down",
        }

        try:
            repository = MongoRepository()
            if repository.ping():
                services["mongo"] = "up"
        except Exception:
            pass

        try:
            rag = RagService()
            collection = rag._get_collection()
            if collection is not None:
                services["chroma"] = "up"
        except Exception:
            pass

        try:
            api_key = os.getenv("OPENAI_API_KEY", "")
            if api_key:
                services["openai"] = "up"
        except Exception:
            pass

        overall = "ok" if all(v == "up" for v in services.values()) else "degraded"
        return Response(
            {"status": overall, "services": services}, status=status.HTTP_200_OK
        )
