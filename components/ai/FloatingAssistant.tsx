"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Bot, X, Sparkles } from "lucide-react";
import AgentChat from "./AgentChat";

export default function FloatingAssistant() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Don't double up on the dedicated /ai page.
  const hidden = pathname?.startsWith("/ai");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  if (hidden) return null;

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open AI assistant"
          className="fixed bottom-5 right-5 z-50 w-13 h-13 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-milestone-blue text-white shadow-card-xl hover:scale-105 active:scale-95 transition-transform"
          style={{ width: 54, height: 54 }}
        >
          <Sparkles size={22} />
        </button>
      )}

      {open && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[1px] animate-fade-in"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed z-50 bottom-0 right-0 sm:bottom-5 sm:right-5 w-full sm:w-[400px] h-[85vh] sm:h-[640px] sm:max-h-[85vh] bg-milestone-bg sm:rounded-2xl shadow-card-xl border border-milestone-line flex flex-col overflow-hidden animate-fade-up">
            <div className="flex items-center justify-between px-4 py-3 border-b border-milestone-line bg-white shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-milestone-blue flex items-center justify-center">
                  <Bot size={15} className="text-white" />
                </div>
                <span className="text-sm font-bold text-gray-900">Assistant</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 min-h-0 px-2">
              <AgentChat variant="drawer" />
            </div>
          </div>
        </>
      )}
    </>
  );
}
