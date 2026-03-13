import { ChatWindow } from "@/components/chat/ChatWindow";

export default function ChatPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col px-4 py-4" style={{ height: 'calc(100dvh - 3.5rem)', maxHeight: '-webkit-fill-available' }}>
      <ChatWindow />
    </main>
  );
}
