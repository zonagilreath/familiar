"use client";

import { useState, useRef, useEffect, FormEvent } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Request failed");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let assistantContent = "";

      setMessages([...newMessages, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              assistantContent += parsed.text;
              setMessages([
                ...newMessages,
                { role: "assistant", content: assistantContent },
              ]);
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: `**Error:** ${message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-dvh max-w-3xl mx-auto">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-stone-800">
        <div className="text-2xl">🐉</div>
        <div>
          <h1 className="text-lg font-semibold text-amber-500">Familiar</h1>
          <p className="text-xs text-stone-400">
            D&D 5e Encounter Assistant
          </p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="text-5xl">🎲</div>
            <h2 className="text-xl font-semibold text-stone-300">
              Ready to build an encounter?
            </h2>
            <p className="text-stone-500 max-w-md">
              Tell me about your party and what kind of encounter you&apos;re
              looking for. I can help with combat encounters, traps, puzzles,
              and more.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {[
                "A deadly encounter for 4 level-5 PCs in a crypt",
                "A forest ambush with goblins and traps",
                "A puzzle encounter for a dragon's lair",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="text-sm px-3 py-1.5 rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-amber-500 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-amber-600/80 text-white"
                  : "bg-stone-800 text-stone-200"
              }`}
            >
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {msg.content}
                {msg.role === "assistant" && isLoading && i === messages.length - 1 && (
                  <span className="inline-block w-1.5 h-4 ml-0.5 bg-amber-500 animate-pulse" />
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="px-4 py-3 border-t border-stone-800"
      >
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Describe an encounter..."
            rows={1}
            className="flex-1 resize-none rounded-xl bg-stone-800 px-4 py-3 text-sm text-stone-100 placeholder-stone-500 outline-none focus:ring-2 focus:ring-amber-600/50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-xl bg-amber-600 px-4 py-3 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-40 disabled:hover:bg-amber-600 transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
