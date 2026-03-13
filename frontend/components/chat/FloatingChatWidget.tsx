"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
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
export function FloatingChatWidget() {
  const pathname = usePathname();
  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
    [],
  );

  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [piiWarning, setPiiWarning] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "I'm TeleBot — your Telesur support assistant. Ask me about mobile plans, fiber internet, or entertainment packages.",
    },
  ]);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Track visual viewport height for iOS keyboard
  const [popupHeight, setPopupHeight] = useState<string>("calc(100vh - 80px)");
  useEffect(() => {
    function update() {
      const h = window.visualViewport?.height ?? window.innerHeight;
      setPopupHeight(`${h - 80}px`);
    }
    update();
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", update);
      return () => vv.removeEventListener("resize", update);
    }
  }, []);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const promptChips = useMemo<PromptChip[]>(
    () => [
      {
        label: "📱 Mobile plans",
        prompt: "What mobile prepaid and postpaid plans does Telesur offer?",
      },
      {
        label: "🌐 Fiber info",
        prompt: "I need fiber internet options and installation info.",
      },
      {
        label: "🎬 Entertainment",
        prompt: "What entertainment bundles are available?",
      },
    ],
    [],
  );

  /* Auto-scroll */
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  /* Focus input when opened */
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen]);

  /* Close with animation */
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 200);
  }, []);

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

  const handleToggle = useCallback(() => {
    if (isOpen) {
      handleClose();
    } else {
      setIsOpen(true);
      setShowTooltip(false);
    }
  }, [isOpen, handleClose]);

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
    setMessages((p) => [...p, userMsg]);
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
        let streamedSources: SourceItem[] = [];
        setMessages((p) => [
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
                setMessages((p) =>
                  p.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: m.content + event.token }
                      : m,
                  ),
                );
              } else if (event.type === "done") {
                setMessages((p) =>
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
        const data = (await res.json()) as ChatApiResponse;
        setSessionId(data.session_id);
        setMessages((p) => [
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
      setMessages((p) => [
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

  // Hide the floating widget on the dedicated chat page
  if (pathname === "/chat") return null;


  return (
    <>
      {/* ── Chat popup window ── */}
      {(isOpen || isClosing) && (
        <div
          className={`fixed z-50 flex flex-col overflow-hidden bg-white shadow-2xl
            ${isClosing ? "animate-chat-close" : "animate-chat-open"}
            bottom-0 left-0 right-0 rounded-t-3xl
            sm:bottom-20 sm:left-auto sm:right-4 sm:rounded-3xl sm:w-[380px] sm:h-[560px] sm:max-h-[calc(100vh-120px)]`}
          style={{ height: popupHeight }}
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-telesur-blue px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-telesur-yellow p-1">
                <Image
                  src="/telesur-logo.png"
                  alt="TeleBot"
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                  priority
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-tight">
                  TeleBot
                </p>
                <p className="text-[11px] text-white/60">
                  Telesur AI Assistant
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={startNewConversation}
                className="rounded-lg px-2 py-1 text-[11px] font-semibold text-telesur-yellow transition hover:bg-white/10"
                type="button"
                title="New conversation"
              >
                + New
              </button>
              <button
                onClick={handleClose}
                className="flex h-7 w-7 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
                type="button"
                title="Close chat"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M14.78 5.22a.75.75 0 00-1.06 0L10 8.94 6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 000-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Welcome text */}
          <div className="border-b border-telesur-blue/10 px-5 py-3">
            <p className="text-[13px] leading-snug text-slate-500">
              Hi! I'm your AI assistant. I can help you with mobile plans, fiber
              internet, or entertainment services.
            </p>
          </div>

          {/* Messages area */}
          <div
            ref={scrollRef}
            className="telebot-scroll flex-1 space-y-1 overflow-y-auto bg-white px-4 py-4"
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

          {/* Powered-by footer */}
          <div className="bg-white px-4 py-1.5 text-center">
            <span className="text-[10px] font-medium text-slate-400">
              Powered by <span className="text-telesur-blue">Telesur</span>{" "}
              &amp; OpenAI
            </span>
          </div>

          {/* Quick prompts (shown when few messages) */}
          {messages.length <= 1 && (
            <div className="animate-fade-in border-t border-slate-100 px-4 py-2">
              <div className="flex flex-wrap gap-1.5">
                {promptChips.map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => {
                      setInput(chip.prompt);
                      inputRef.current?.focus();
                    }}
                    className="rounded-full border border-telesur-blue/15 bg-white px-3 py-1 text-[12px] font-medium text-telesur-blue/70 transition hover:border-telesur-blue/30 hover:text-telesur-blue"
                    type="button"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PII warning */}
          {piiWarning && (
            <div className="mx-4 mb-1 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              Your message contains personal information (phone number, email, ID, or card number). Please remove it before sending.
            </div>
          )}

          {/* Input bar */}
          <form
            onSubmit={onSubmit}
            className="flex items-center gap-2 border-t border-slate-100 bg-white px-4 py-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (piiWarning) setPiiWarning(false);
              }}
              placeholder="Type your question..."
              className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-telesur-blue/40 focus:ring-2 focus:ring-telesur-blue/10"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-telesur-blue text-white shadow-sm transition hover:bg-telesur-blue-light disabled:opacity-50 active:scale-95"
              title="Send message"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* ── Tooltip notification ── */}
      {!isOpen && !isClosing && showTooltip && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-20 z-50 animate-slide-up">
          <div className="glass-card relative max-w-[240px] rounded-2xl border-2 border-blue-200 bg-white p-3 shadow-2xl">
            <button
              onClick={() => setShowTooltip(false)}
              className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close notification"
            >
              ×
            </button>
            <div className="flex items-start gap-2 pr-4">
              <span className="text-lg">💬</span>
              <div>
                <p className="text-xs font-bold text-slate-800">TeleBot</p>
                <p className="mt-0.5 text-[11px] text-slate-600">
                  Heb je vragen? Chat met mij!
                </p>
              </div>
            </div>
            {/* Arrow pointing to button - hidden on mobile */}
            <div className="absolute -right-2 bottom-3 h-4 w-4 rotate-45 border-b-2 border-r-2 border-blue-200 bg-white hidden sm:block"></div>
            {/* Arrow pointing down on mobile */}
            <div className="absolute -bottom-2 right-8 h-4 w-4 rotate-45 border-b-2 border-r-2 border-blue-200 bg-white sm:hidden"></div>
          </div>
        </div>
      )}

      {/* ── Floating action button ── hidden on mobile when chat is open (header has its own X) */}
      <button
        onClick={handleToggle}
        onMouseEnter={() => {
          if (!isOpen) setShowTooltip(true);
        }}
        className={`fixed bottom-4 sm:bottom-6 right-4 sm:right-5 z-50 flex h-14 w-14 sm:h-12 sm:w-12 items-center justify-center overflow-hidden shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl active:scale-95 ${
          isOpen
            ? "bg-telesur-blue rounded-2xl rotate-0 hidden sm:flex"
            : "bg-telesur-yellow animate-bounce-subtle rounded-[18px]"
        }`}
        type="button"
        aria-label={isOpen ? "Close chat assistant" : "Open chat assistant"}
      >
        <div
          className={`transition-transform duration-300 ${isOpen ? "rotate-90" : "rotate-0"}`}
        >
          {isOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5 text-white"
            >
              <path
                fillRule="evenodd"
                d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <Image
              src="/telesur-logo.png"
              alt="Chat with TeleBot"
              width={48}
              height={48}
              className="h-8 w-8 object-cover"
              priority
            />
          )}
        </div>
      </button>
    </>
  );
}
