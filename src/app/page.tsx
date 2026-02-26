"use client";

import { useState, useEffect, useCallback } from "react";
import EncounterForm from "@/components/EncounterForm";
import EncounterSheet from "@/components/EncounterSheet";
import type { Encounter, EncounterRequest } from "@/types/encounter";

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

type View = "form" | "sheet";

export default function Home() {
  const [view, setView] = useState<View>("form");
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhrase, setLoadingPhrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<EncounterRequest | null>(null);

  useEffect(() => {
    if (!isLoading) return;
    setLoadingPhrase(randomLoadingPhrase());
    const interval = setInterval(() => {
      setLoadingPhrase(randomLoadingPhrase());
    }, 3000);
    return () => clearInterval(interval);
  }, [isLoading]);

  const generate = useCallback(async (req: EncounterRequest) => {
    setLastRequest(req);
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Request failed (${res.status})`);
      }

      const data: Encounter = await res.json();
      setEncounter(data);
      setView("sheet");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  function handleBack() {
    setView("form");
    setError(null);
  }

  function handleRegenerate() {
    if (lastRequest) {
      generate(lastRequest);
      setView("form");
    }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col">
      {/* Header (form view) */}
      {view === "form" && (
        <header className="flex items-center justify-between border-b border-primary/20 px-6 py-4 lg:px-20 bg-bg-dark/50 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-primary text-3xl">
              auto_fix_high
            </span>
            <h2 className="text-xl font-bold font-fantasy tracking-wide">
              Familiar
            </h2>
          </div>
        </header>
      )}

      {/* Error banner */}
      {error && (
        <div className="bg-rose-500/10 border-b border-rose-500/30 px-6 py-3 text-rose-400 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">error</span>
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto text-rose-400 hover:text-white"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}

      {/* Views */}
      {view === "form" && (
        <EncounterForm
          onGenerate={generate}
          isLoading={isLoading}
          loadingPhrase={loadingPhrase}
        />
      )}

      {view === "sheet" && encounter && (
        <EncounterSheet
          encounter={encounter}
          onBack={handleBack}
          onRegenerate={handleRegenerate}
        />
      )}
    </div>
  );
}
