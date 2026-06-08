"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bot, Send, Sparkles, RotateCcw, Check, User } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  actions?: string[];
}

const STARTERS = [
  "Break “launch our new pricing page” into milestones",
  "Show me my kill list and tell me what to cut",
  "Add Acme Corp as a company and a deal worth 25000",
  "What should I work on next?",
];

export default function AgentChat({ variant = "page" }: { variant?: "page" | "drawer" }) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || pending) return;
      setError(null);
      const next: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
      setMessages(next);
      setInput("");
      setPending(true);
      try {
        const res = await fetch("/api/ai/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })) }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Something went wrong");
        setMessages((m) => [...m, { role: "assistant", content: data.reply, actions: data.actions ?? [] }]);
        if (data.mutated) router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Assistant error");
      } finally {
        setPending(false);
        inputRef.current?.focus();
      }
    },
    [messages, pending, router]
  );

  const retrySend = useCallback(async () => {
    if (pending) return;
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messages.map(({ role, content }) => ({ role, content })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setMessages((m) => [...m, { role: "assistant", content: data.reply, actions: data.actions ?? [] }]);
      if (data.mutated) router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Assistant error");
    } finally {
      setPending(false);
      inputRef.current?.focus();
    }
  }, [messages, pending, router]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  }

  const empty = messages.length === 0;

  return (
    <div className={`flex flex-col ${variant === "page" ? "h-[calc(100vh-9rem)] max-w-3xl" : "h-full"}`}>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-1 py-2 space-y-4">
        {empty && (
          <div className="px-3 py-6">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                <Sparkles size={18} className="text-milestone-blue" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Milestone Assistant</p>
                <p className="text-xs text-gray-400">I can create goals, plan milestones, work your kill list, and manage your CRM.</p>
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => void send(s)}
                  className="block w-full text-left text-[13px] font-medium text-gray-600 bg-gray-50 hover:bg-milestone-blue-dim hover:text-milestone-blue border border-milestone-line rounded-lg px-3.5 py-2.5 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                m.role === "user" ? "bg-milestone-blue" : "bg-gradient-to-br from-purple-100 to-blue-100"
              }`}
            >
              {m.role === "user" ? <User size={14} className="text-white" /> : <Bot size={14} className="text-milestone-blue" />}
            </div>
            <div className={`min-w-0 max-w-[85%] ${m.role === "user" ? "items-end" : ""}`}>
              <div
                className={`rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
                  m.role === "user" ? "bg-milestone-blue text-white" : "bg-white border border-milestone-line text-gray-700"
                }`}
              >
                {m.content}
              </div>
              {m.actions && m.actions.length > 0 && (
                <div className="mt-1.5 space-y-1">
                  {m.actions.map((a, j) => (
                    <div key={j} className="flex items-center gap-1.5 text-[11px] font-medium text-milestone-green">
                      <Check size={12} className="shrink-0" />
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {pending && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center shrink-0">
              <Bot size={14} className="text-milestone-blue" />
            </div>
            <div className="bg-white border border-milestone-line rounded-2xl px-3.5 py-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" />
            </div>
          </div>
        )}

        {error && (
          <div className="mx-1 text-xs text-milestone-red bg-milestone-red-dim border border-milestone-red/20 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
            <span>{error}</span>
            <button
              onClick={retrySend}
              className="flex items-center gap-1 text-milestone-blue hover:underline shrink-0 font-medium"
            >
              <RotateCcw size={11} />
              Retry
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-milestone-line bg-white px-2 py-2.5">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Ask the assistant to plan, create, or triage…"
            className="flex-1 resize-none max-h-32 px-3.5 py-2.5 border border-milestone-line rounded-xl text-[13px] font-medium placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-milestone-blue transition-all"
          />
          <button
            onClick={() => void send(input)}
            disabled={pending || !input.trim()}
            className="w-10 h-10 shrink-0 flex items-center justify-center bg-milestone-blue text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send"
          >
            {pending ? <RotateCcw size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
