"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import Markdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const LOADING_VERBS = [
  "Consulting",
  "Summoning",
  "Interrogating",
  "Polishing",
  "Sharpening",
  "Bargaining with",
  "Rousing",
  "Feeding",
  "Waking",
  "Bribing",
  "Befriending",
  "Recruiting",
  "Distracting",
  "Petting",
  "Flattering",
  "Scolding",
  "Negotiating with",
  "Pacifying",
  "Outwitting",
  "Dusting off",
];

const LOADING_NOUNS = [
  "goblins",
  "the oracle",
  "dire wolves",
  "ancient tomes",
  "enchanted swords",
  "a sleeping dragon",
  "tavern regulars",
  "the dungeon keeper",
  "spectral librarians",
  "mimics",
  "a cranky lich",
  "owlbears",
  "a wandering bard",
  "the war council",
  "arcane scrolls",
  "a suspicious chest",
  "kobold scouts",
  "the guild master",
  "a sentient door",
  "the bones",
];

function randomLoadingPhrase(): string {
  const verb = LOADING_VERBS[Math.floor(Math.random() * LOADING_VERBS.length)];
  const noun = LOADING_NOUNS[Math.floor(Math.random() * LOADING_NOUNS.length)];
  return `${verb} ${noun}`;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhrase, setLoadingPhrase] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isLoading) return;
    setLoadingPhrase(randomLoadingPhrase());
    const interval = setInterval(() => {
      setLoadingPhrase(randomLoadingPhrase());
    }, 3000);
    return () => clearInterval(interval);
  }, [isLoading]);

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
    setMessages([...newMessages, { role: "assistant", content: "" }]);
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
              <div className="text-sm leading-relaxed">
                {msg.role === "assistant" && !msg.content && isLoading && i === messages.length - 1 ? (
                  <span className="text-stone-500 italic">{loadingPhrase}...</span>
                ) : msg.role === "assistant" ? (
                  <Markdown
                    components={{
                      h1: (props) => <h1 className="text-lg font-bold text-amber-500 mt-4 mb-2 first:mt-0" {...props} />,
                      h2: (props) => <h2 className="text-base font-bold text-amber-500 mt-4 mb-2 first:mt-0" {...props} />,
                      h3: (props) => <h3 className="text-sm font-bold text-amber-400 mt-3 mb-1 first:mt-0" {...props} />,
                      h4: (props) => <h4 className="text-sm font-semibold text-amber-400 mt-2 mb-1 first:mt-0" {...props} />,
                      p: (props) => <p className="mb-2 last:mb-0" {...props} />,
                      ul: (props) => <ul className="list-disc list-outside ml-4 mb-2 space-y-1" {...props} />,
                      ol: (props) => <ol className="list-decimal list-outside ml-4 mb-2 space-y-1" {...props} />,
                      li: (props) => <li className="pl-1" {...props} />,
                      strong: (props) => <strong className="font-semibold text-stone-100" {...props} />,
                      em: (props) => <em className="text-stone-400" {...props} />,
                      code: (props) => <code className="bg-stone-900 px-1.5 py-0.5 rounded text-amber-400 text-xs" {...props} />,
                      pre: (props) => <pre className="bg-stone-900 rounded-lg p-3 my-2 overflow-x-auto text-xs" {...props} />,
                      blockquote: (props) => <blockquote className="border-l-2 border-amber-600 pl-3 my-2 text-stone-400 italic" {...props} />,
                      hr: () => <hr className="border-stone-700 my-3" />,
                      table: (props) => <div className="overflow-x-auto my-2"><table className="text-xs border-collapse w-full" {...props} /></div>,
                      thead: (props) => <thead className="border-b border-stone-600" {...props} />,
                      th: (props) => <th className="text-left px-2 py-1 font-semibold text-amber-400" {...props} />,
                      td: (props) => <td className="px-2 py-1 border-t border-stone-700/50" {...props} />,
                    }}
                  >
                    {msg.content}
                  </Markdown>
                ) : (
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                )}
                {msg.role === "assistant" && msg.content && isLoading && i === messages.length - 1 && (
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
