import { SourceAttribution, type SourceItem } from "./SourceAttribution";

type MessageBubbleProps = {
  role: "user" | "assistant";
  content: string;
  sources?: SourceItem[];
};

export function MessageBubble({
  role,
  content,
  sources = [],
}: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <article
      className={`animate-fade-in max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[75%] ${
        isUser
          ? "ml-auto bg-sky-600 text-white"
          : "mr-auto bg-white text-slate-700 shadow-sm border border-slate-100"
      }`}
    >
      <p
        className={`mb-1 text-[10px] font-semibold uppercase tracking-widest ${
          isUser ? "text-sky-200" : "text-slate-400"
        }`}
      >
        {isUser ? "You" : "TeleBot"}
      </p>
      <p className="whitespace-pre-wrap">{content}</p>
      {!isUser && sources.length > 0 && <SourceAttribution sources={sources} />}
    </article>
  );
}
