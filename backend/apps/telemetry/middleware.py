from __future__ import annotations

import time

from django.http import HttpRequest, HttpResponse

from apps.telemetry.services.telemetry_service import TelemetryService


class ApiTelemetryMiddleware:
    """Log non-chat API request latency/status for monitoring visibility."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        started = time.perf_counter()
        response = self.get_response(request)

        path = request.path or ""
        if path.startswith("/api/") and path not in {
            "/api/chat",
            "/api/chat/stream",
            "/api/telemetry",
            "/api/dashboard",
            "/api/feedback",
            "/api/health",
        }:
            status_text = "ok" if response.status_code < 400 else "error"
            elapsed_ms = int((time.perf_counter() - started) * 1000)
            endpoint = f"{request.method} {path}"
            error_message = ""
            if status_text == "error":
                error_message = f"HTTP {response.status_code}"
            try:
                TelemetryService().log_request(
                    endpoint=endpoint,
                    ttft_ms=elapsed_ms,
                    total_tokens_est=0,
                    status=status_text,
                    error_message=error_message,
                )
            except Exception:
                # Telemetry should never block user API behavior.
                pass

        return response
