import os

from apps.chat.services.llm_service import LLMService
from apps.conversations.services.history_service import HistoryService


class SummaryService:
    def __init__(self) -> None:
        self.trigger_every = self._get_trigger_every()
        self.llm_service = LLMService()

    @staticmethod
    def _get_trigger_every() -> int:
        raw = os.getenv("SUMMARY_TRIGGER_EVERY", "10")
        try:
            value = int(raw)
        except ValueError:
            value = 10
        return max(1, value)

    def should_refresh(
        self,
        message_count: int,
        force: bool = False,
        previous_count: int | None = None,
    ) -> bool:
        if force:
            return True
        if message_count <= 0:
            return False
        if previous_count is not None:
            if previous_count < 0:
                previous_count = 0
            return (previous_count // self.trigger_every) < (message_count // self.trigger_every)
        return message_count % self.trigger_every == 0

    def generate_and_store(self, session_id: str, history_service: HistoryService) -> str:
        previous_summary = history_service.get_summary(session_id=session_id)
        messages = history_service.get_messages(session_id=session_id)
        summary = self.llm_service.summarize_messages(
            messages=messages,
            previous_summary=previous_summary,
        )
        history_service.update_summary(session_id=session_id, summary=summary)
        return summary
