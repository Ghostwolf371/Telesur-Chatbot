import os
import re
from typing import Pattern


class GuardrailService:
    def __init__(self) -> None:
        self.refusal_message = os.getenv(
            "SAFETY_REFUSAL_MESSAGE",
            "I cannot help with requests for secrets, credentials, or instruction bypass attempts.",
        )
        self._pii_refusal = (
            "It looks like your message contains personal information "
            "(e.g. ID number, phone number, credit-card number or e-mail). "
            "Please remove it before sending."
        )
        self._blocked_patterns: list[Pattern[str]] = [
            re.compile(r"\bignore\s+(?:all\s+)?(?:previous|prior)\s+instructions?\b", re.IGNORECASE),
            re.compile(r"\breveal\s+(?:the\s+)?(?:system|internal|developer)\s+prompt\b", re.IGNORECASE),
            re.compile(r"\b(?:api[\s_-]?key|password|token|secret|credential)s?\b", re.IGNORECASE),
            re.compile(r"\b(?:bypass\s+(?:safety|guardrails?)|jailbreak|override\s+instructions?)\b", re.IGNORECASE),
        ]
        self._pii_patterns: list[Pattern[str]] = [
            # Surinamese / Dutch BSN-style 9-digit ID
            re.compile(r"\b\d{9}\b"),
            # Credit-card numbers (13–19 digits, optional separators)
            re.compile(r"\b(?:\d[ -]?){13,19}\b"),
            # Phone: +597 / 06 / 08xx / international +XX
            re.compile(r"(?:\+\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b"),
            # E-mail address
            re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"),
        ]

    def is_blocked(self, user_message: str) -> bool:
        return any(pattern.search(user_message) for pattern in self._blocked_patterns)

    def contains_pii(self, user_message: str) -> bool:
        return any(pattern.search(user_message) for pattern in self._pii_patterns)
