import os
from typing import Any, Generator

from openai import OpenAI


def _env_int(name: str, default: int, minimum: int = 1) -> int:
    raw = os.getenv(name, str(default))
    try:
        value = int(raw)
    except ValueError:
        value = default
    return max(minimum, value)


class LLMService:
    def __init__(self) -> None:
        self.api_key = os.getenv("OPENAI_API_KEY", "")
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self.client = OpenAI(api_key=self.api_key) if self.api_key else None
        self.prompt_recent_messages = _env_int("TELEBOT_PROMPT_RECENT_MESSAGES", 10)
        self.prompt_recent_tokens = _env_int("TELEBOT_PROMPT_RECENT_TOKENS", 1200)
        self.retrieval_recent_user_turns = _env_int(
            "TELEBOT_RETRIEVAL_RECENT_USER_TURNS", 6
        )
        self.retrieval_recent_tokens = _env_int("TELEBOT_RETRIEVAL_RECENT_TOKENS", 400)
        self.summary_recent_messages = _env_int("TELEBOT_SUMMARY_RECENT_MESSAGES", 24)
        self.summary_recent_tokens = _env_int("TELEBOT_SUMMARY_RECENT_TOKENS", 1400)

    def _select_recent_messages(
        self,
        messages: list[dict[str, Any]],
        *,
        max_messages: int,
        max_tokens: int,
    ) -> list[dict[str, Any]]:
        if not messages:
            return []

        selected: list[dict[str, Any]] = []
        total_tokens = 0
        for message in reversed(messages):
            content = str(message.get("content", "")).strip()
            if not content:
                continue
            role = str(message.get("role", "user")).strip().lower()
            candidate = {"role": role, "content": content}
            message_tokens = self.estimate_tokens(f"{role}: {content}")

            if selected and len(selected) >= max_messages:
                break
            if selected and total_tokens + message_tokens > max_tokens:
                break

            selected.append(candidate)
            total_tokens += message_tokens

        selected.reverse()
        return selected

    def _format_recent_messages(
        self, recent_messages: list[dict[str, Any]] | None
    ) -> str:
        if not recent_messages:
            return "No recent turns available."

        selected_messages = self._select_recent_messages(
            recent_messages,
            max_messages=self.prompt_recent_messages,
            max_tokens=self.prompt_recent_tokens,
        )

        lines: list[str] = []
        for message in selected_messages:
            content = str(message.get("content", "")).strip()
            if not content:
                continue
            role = str(message.get("role", "user")).strip().lower()
            role_label = "User" if role == "user" else "Assistant"
            lines.append(f"{role_label}: {content}")
        return "\n".join(lines) if lines else "No recent turns available."

    @staticmethod
    def _sanitize_generated_reply(generated: str) -> str:
        lowered = generated.lower()
        blocked_markers = (
            "compressed conversation",
            "gecomprimeerde conversatie",
            "conversation summary",
            "samenvatting van het gesprek",
            "hidden context",
            "verborgen context",
            "internal prompt",
        )
        if any(marker in lowered for marker in blocked_markers):
            return (
                "Ik help je graag met deze vervolgvraag. Bedoel je de kosten voor het omzetten naar "
                "eSIM of voor een specifiek mobiel pakket? Dan geef ik direct het juiste bedrag."
            )
        return generated

    # ── Few-shot examples (compact) ──
    FEW_SHOT_EXAMPLES = (
        "Example 1:\n"
        "User: Wat kost 100/100 internet?\n"
        "TeleBot: Het Basic pakket (100/100 Mbps) kost SRD 1.099,29/maand (excl. BTW). Wil je upgraden?\n\n"
        "Example 2:\n"
        "User: ja\n"
        "TeleBot: Het Streaming pakket (200/200) kost SRD 1.868,78/maand. Aanvragen via MyTelesur of 152.\n"
    )

    def build_retrieval_query(
        self,
        *,
        user_message: str,
        recent_messages: list[dict[str, Any]] | None,
    ) -> str:
        if not recent_messages:
            return user_message

        # Follow-ups and back-references ("waaarnaar vroeg ik net?",
        # "ja", "yes", "ok", "nee", "dat bedoel ik") need context from
        # the last assistant reply to form a meaningful retrieval query.
        # We always include the last assistant turn so the retrieval
        # query captures the current conversation topic.
        short_followup = len(user_message.split()) <= 8

        recent_turns: list[str] = []
        tokens_used = 0
        collected_user_turns = 0
        included_assistant = False
        for message in reversed(recent_messages):
            role = str(message.get("role", "")).strip().lower()
            content = str(message.get("content", "")).strip()
            if not content:
                continue

            # Always include the last assistant message for context so
            # references like "what did I just ask" can be resolved.
            if role == "assistant" and not included_assistant:
                turn_tokens = self.estimate_tokens(content)
                recent_turns.append(content)
                tokens_used += turn_tokens
                included_assistant = True
                continue

            if role != "user":
                continue

            turn_tokens = self.estimate_tokens(content)
            if collected_user_turns >= self.retrieval_recent_user_turns:
                break
            if (
                collected_user_turns > 0
                and tokens_used + turn_tokens > self.retrieval_recent_tokens
            ):
                break

            recent_turns.append(content)
            tokens_used += turn_tokens
            collected_user_turns += 1

        if not recent_turns:
            return user_message

        recent_turns.reverse()
        return "\n".join(recent_turns)

    def _build_openai_messages(
        self,
        user_message: str,
        context: str,
        summary: str | None,
        recent_messages: list[dict[str, Any]] | None,
    ) -> list[dict[str, str]]:
        """Build the messages array for OpenAI Chat Completions."""
        summary_text = summary or "No previous summary available."
        recent_text = self._format_recent_messages(recent_messages)
        system_prompt = (
            "You are TeleBot, Telesur customer support assistant. Answer directly using the context below.\n"
            "Rules: 1) Give specific data (prices, speeds, codes) from context. "
            "2) Read the conversation turns to resolve references ('dat', 'dit', 'what did I ask'). "
            "3) Reply in the user's language (Dutch/English). "
            "4) Be concise: 1-3 sentences max. "
            "5) Never repeat a previous answer; on 'ja'/'yes' give NEW info. "
            "6) For unresolvable issues: Telesur support 152 / WhatsApp +597 8885888.\n\n"
            f"{self.FEW_SHOT_EXAMPLES}\n"
            f"Memory: {summary_text}\n\n"
            f"Conversation:\n{recent_text}\n\n"
            f"Context:\n{context}"
        )
        return [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ]

    def generate_reply(
        self,
        user_message: str,
        context: str,
        summary: str | None = None,
        recent_messages: list[dict[str, Any]] | None = None,
    ) -> str:
        if not self.client:
            return "OpenAI API key is not configured. Please contact the administrator."

        messages = self._build_openai_messages(user_message, context, summary, recent_messages)
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.3,
                top_p=0.9,
                max_tokens=200,
            )
            generated = (response.choices[0].message.content or "").strip()
            if generated:
                return self._sanitize_generated_reply(generated)
        except Exception:
            pass

        return (
            "I encountered a temporary problem connecting to the AI service. "
            "Please try again in a moment, or contact Telesur support for urgent help."
        )

    def generate_reply_stream(
        self,
        user_message: str,
        context: str,
        summary: str | None = None,
        recent_messages: list[dict[str, Any]] | None = None,
    ) -> Generator[str, None, str]:
        """Yield tokens as they arrive from OpenAI. Returns the full text."""
        if not self.client:
            fallback = "OpenAI API key is not configured. Please contact the administrator."
            yield fallback
            return fallback

        messages = self._build_openai_messages(user_message, context, summary, recent_messages)
        full_text = ""
        try:
            stream = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.3,
                top_p=0.9,
                max_tokens=200,
                stream=True,
            )
            for chunk in stream:
                delta = chunk.choices[0].delta if chunk.choices else None
                if delta and delta.content:
                    token = delta.content
                    full_text += token
                    yield token
            if full_text.strip():
                sanitized = self._sanitize_generated_reply(full_text.strip())
                if sanitized != full_text.strip():
                    return sanitized
                return full_text.strip()
        except Exception:
            pass

        fallback = (
            "I encountered a temporary problem connecting to the AI service. "
            "Please try again in a moment, or contact Telesur support for urgent help."
        )
        if not full_text.strip():
            yield fallback
        return full_text.strip() or fallback

    def summarize_messages(
        self,
        messages: list[dict[str, Any]],
        previous_summary: str | None = None,
    ) -> str:
        if not messages and not previous_summary:
            return "No conversation yet."

        if not self.client:
            last = messages[-1]["content"] if messages else ""
            return previous_summary or f"Recent topic: {last[:180]}"

        recent_for_summary = self._select_recent_messages(
            messages,
            max_messages=self.summary_recent_messages,
            max_tokens=self.summary_recent_tokens,
        )
        joined = "\n".join(
            f"{str(m.get('role', 'user'))}: {str(m.get('content', '')).strip()}"
            for m in recent_for_summary
            if str(m.get("content", "")).strip()
        )
        previous_summary_text = previous_summary or "No previous summary available."

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You maintain long-term memory for a telecom support chat.\n"
                            "Update the running summary using the previous summary and recent turns.\n"
                            "Return plain text with 4-6 short bullet lines.\n"
                            "Include: user goal, discussed services, concrete facts/prices, and open follow-ups.\n"
                            "Do not mention that this is a summary."
                        ),
                    },
                    {
                        "role": "user",
                        "content": (
                            f"Previous summary:\n{previous_summary_text}\n\n"
                            f"Recent turns:\n{joined}"
                        ),
                    },
                ],
                temperature=0.3,
                max_tokens=300,
            )
            generated = (response.choices[0].message.content or "").strip()
            if generated:
                return generated
        except Exception:
            pass

        if previous_summary:
            return previous_summary

        last = messages[-1]["content"] if messages else ""
        return f"Recent topic: {last[:180]}"

    @staticmethod
    def estimate_tokens(text: str) -> int:
        return max(1, int(len(text.split()) * 1.3))
