export const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.2:3b";

function base() {
  return (process.env.OLLAMA_BASE_URL ?? "http://localhost:11434").replace(/\/$/, "");
}

export function ollamaConfigured() {
  return !!process.env.OLLAMA_BASE_URL;
}

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function ollamaChat(messages: Message[], json = false): Promise<string> {
  const res = await fetch(`${base()}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: false,
      ...(json ? { format: "json" } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Ollama ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return (data.message?.content ?? "").trim();
}
