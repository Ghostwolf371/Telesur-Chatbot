"use client";

import { ChatWindow } from "@/components/chat/ChatWindow";
import { useEffect, useState } from "react";

export default function ChatPage() {
  const [height, setHeight] = useState<string>("calc(100vh - 3.5rem)");

  useEffect(() => {
    function updateHeight() {
      const vh = window.visualViewport?.height ?? window.innerHeight;
      setHeight(`${vh - 56}px`); // 56px = 3.5rem navbar
    }
    updateHeight();
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", updateHeight);
      vv.addEventListener("scroll", updateHeight);
    } else {
      window.addEventListener("resize", updateHeight);
    }
    return () => {
      if (vv) {
        vv.removeEventListener("resize", updateHeight);
        vv.removeEventListener("scroll", updateHeight);
      } else {
        window.removeEventListener("resize", updateHeight);
      }
    };
  }, []);

  return (
    <main
      className="mx-auto flex w-full max-w-4xl flex-col px-4 py-4 overflow-hidden"
      style={{ height }}
    >
      <ChatWindow />
    </main>
  );
}
