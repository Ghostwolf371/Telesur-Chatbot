import os
import re
from typing import Pattern


class GuardrailService:
    def __init__(self) -> None:
        self.refusal_message = os.getenv(
            "SAFETY_REFUSAL_MESSAGE",
            "I cannot help with requests for secrets, credentials, or instruction bypass attempts.",
        )
        self._blocked_patterns: list[Pattern[str]] = [
            re.compile(r"\bignore\s+(?:all\s+)?(?:previous|prior)\s+instructions?\b", re.IGNORECASE),
            re.compile(r"\breveal\s+(?:the\s+)?(?:system|internal|developer)\s+prompt\b", re.IGNORECASE),
            re.compile(r"\b(?:api[\s_-]?key|password|token|secret|credential)s?\b", re.IGNORECASE),
            re.compile(r"\b(?:bypass\s+(?:safety|guardrails?)|jailbreak|override\s+instructions?)\b", re.IGNORECASE),
        ]

    def is_blocked(self, user_message: str) -> bool:
        return any(pattern.search(user_message) for pattern in self._blocked_patterns)
