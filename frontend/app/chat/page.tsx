import { ChatWindow } from "@/components/chat/ChatWindow";

export default function ChatPage() {
  return (
    <main className="mx-auto flex h-[calc(100vh-3.5rem)] w-full max-w-4xl flex-col px-4 py-4">
      <ChatWindow />
    </main>
  );
}
