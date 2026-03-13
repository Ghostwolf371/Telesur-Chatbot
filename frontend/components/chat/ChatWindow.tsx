"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageBubble } from "./MessageBubble";
import type { SourceItem } from "./SourceAttribution";
import { containsPII } from "@/lib/pii";

/* ── Types ── */
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceItem[];
};

type ChatApiResponse = {
  session_id: string;
  assistant_message: string;
  sources: SourceItem[];
  telemetry: { ttft_ms: number; total_tokens_est: number };
};

type PromptChip = {
  label: string;
  prompt: string;
};

/* ── Component ── */
export function ChatWindow() {
  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
    [],
  );

  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [piiWarning, setPiiWarning] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm TeleBot — your Telesur support assistant. Ask me about mobile plans, fiber internet, or entertainment packages.",
    },
  ]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const promptChips = useMemo<PromptChip[]>(
    () => [
      {
        label: "📱 Mobile plans",
        prompt: "What mobile prepaid and postpaid plans does Telesur offer?",
      },
      {
        label: "🌐 Fiber info",
        prompt:
          "I need fiber internet options and installation info for home use.",
      },
      {
        label: "🎬 Entertainment",
        prompt: "What entertainment bundles are available with internet?",
      },
    ],
    [],
  );

  /* Auto-scroll */
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const startNewConversation = () => {
    setSessionId(undefined);
    setInput("");
    setIsLoading(false);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content: "New conversation started. How can I help you today?",
      },
    ]);
    inputRef.current?.focus();
  };

  /* ── Submit feedback ── */
  const handleFeedback = useCallback(
    async (positive: boolean, msgIndex: number) => {
      if (!sessionId) return;
      const assistantMsg = messages[msgIndex];
      const userMsg = messages
        .slice(0, msgIndex)
        .reverse()
        .find((m) => m.role === "user");
      try {
        await fetch(`${apiBaseUrl}/api/feedback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            rating: positive ? 5 : 1,
            success: positive,
            scenario: "other",
            user_question: userMsg?.content || "",
            assistant_answer: assistantMsg?.content || "",
          }),
        });
      } catch {
        /* feedback is best-effort */
      }
    },
    [sessionId, apiBaseUrl, messages],
  );

  /* ── Send message ── */
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    if (containsPII(trimmed)) {
      setPiiWarning(true);
      return;
    }
    setPiiWarning(false);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };
    const assistantMsgId = crypto.randomUUID();
    setMessages((p: ChatMessage[]) => [...p, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(`${apiBaseUrl}/api/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: "web-user",
          message: trimmed,
        }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("text/event-stream") && res.body) {
        // ── SSE streaming path ──
        let streamedSources: SourceItem[] = [];

        // Add empty assistant bubble that we'll fill incrementally
        setMessages((p: ChatMessage[]) => [
          ...p,
          { id: assistantMsgId, role: "assistant", content: "", sources: [] },
        ]);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Parse SSE lines
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6);
            try {
              const event = JSON.parse(jsonStr);
              if (event.type === "meta") {
                setSessionId(event.session_id);
                streamedSources = event.sources || [];
              } else if (event.type === "token") {
                setMessages((p: ChatMessage[]) =>
                  p.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: m.content + event.token }
                      : m,
                  ),
                );
              } else if (event.type === "done") {
                // Attach sources now that streaming is complete
                setMessages((p: ChatMessage[]) =>
                  p.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, sources: streamedSources }
                      : m,
                  ),
                );
              }
            } catch {
              /* skip malformed JSON */
            }
          }
        }
      } else {
        // ── Fallback: non-streaming JSON response (guardrail refusal etc.) ──
        const data = (await res.json()) as ChatApiResponse;
        setSessionId(data.session_id);
        setMessages((p: ChatMessage[]) => [
          ...p,
          {
            id: assistantMsgId,
            role: "assistant",
            content: data.assistant_message,
            sources: data.sources,
          },
        ]);
      }
    } catch {
      setMessages((p: ChatMessage[]) => [
        ...p,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Could not reach the backend. Please check if the service is running and try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const shortSession = sessionId
    ? `${sessionId.slice(0, 6)}…${sessionId.slice(-4)}`
    : "new";

  /* ── Render ── */
  return (
    <div className="flex flex-1 flex-col gap-3 overflow-hidden">
      {/* Chat card */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-telesur-blue/10 bg-white shadow-sm">
        {/* Header bar */}
        <div className="flex items-center justify-between bg-telesur-blue px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-telesur-yellow" />
            <span className="text-sm font-semibold text-white">TeleBot</span>
            <span className="rounded-md bg-white/15 px-2 py-0.5 text-[11px] font-medium text-white/70">
              {shortSession}
            </span>
          </div>
          <button
            onClick={startNewConversation}
            className="rounded-lg bg-telesur-yellow px-3 py-1.5 text-xs font-semibold text-telesur-blue transition hover:bg-telesur-yellow-light"
            type="button"
          >
            + New Chat
          </button>
        </div>

        {/* Prompt chips */}
        {messages.length <= 1 && (
          <div className="animate-fade-in border-b border-telesur-blue/10 px-4 py-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-telesur-blue/40">
              Quick prompts
            </p>
            <div className="flex flex-wrap gap-2">
              {promptChips.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => {
                    setInput(chip.prompt);
                    inputRef.current?.focus();
                  }}
                  className="rounded-lg border border-telesur-blue/15 bg-telesur-blue/[0.03] px-3 py-1.5 text-xs font-medium text-telesur-blue/70 transition hover:border-telesur-blue/30 hover:bg-telesur-blue/[0.08] hover:text-telesur-blue"
                  type="button"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages area */}
        <div
          ref={scrollRef}
          className="telebot-scroll flex-1 space-y-1 overflow-y-auto bg-slate-50/50 px-4 py-4"
        >
          {messages.map((msg, idx) => (
            <MessageBubble
              key={msg.id}
              role={msg.role}
              content={msg.content}
              sources={msg.sources}
              onFeedback={
                msg.role === "assistant" && !msg.id.startsWith("welcome")
                  ? (positive: boolean) => handleFeedback(positive, idx)
                  : undefined
              }
            />
          ))}
          {isLoading && (
            <div className="animate-fade-in flex items-center gap-1.5 py-2 pl-1">
              <span className="animate-dot-1 h-2 w-2 rounded-full bg-telesur-blue" />
              <span className="animate-dot-2 h-2 w-2 rounded-full bg-telesur-blue" />
              <span className="animate-dot-3 h-2 w-2 rounded-full bg-telesur-blue" />
            </div>
          )}
        </div>

        {/* PII warning */}
        {piiWarning && (
          <div className="mx-4 mb-1 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            Your message contains personal information (phone number, email, ID, or card number). Please remove it before sending.
          </div>
        )}

        {/* Input bar */}
        <form
          onSubmit={onSubmit}
          className="flex flex-shrink-0 items-center gap-2 border-t border-telesur-blue/10 bg-white px-4 py-3"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (piiWarning) setPiiWarning(false);
            }}
            placeholder="Ask about Telesur services…"
            className="h-10 flex-1 rounded-xl border border-telesur-blue/15 bg-slate-50 px-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-telesur-blue/40 focus:ring-2 focus:ring-telesur-blue/10"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex h-10 items-center rounded-xl bg-telesur-blue px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-telesur-blue-light disabled:opacity-50 active:scale-[0.97]"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
