"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import EncounterForm from "@/components/EncounterForm";
import EncounterSheet from "@/components/EncounterSheet";
import LoadingScreen from "@/components/LoadingScreen";
import type { Encounter, EncounterKind, EncounterRequest } from "@/types/encounter";
import { DEMO_ENCOUNTERS, DEMO_KINDS } from "@/lib/demo-encounters";

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

type View = "form" | "loading" | "success" | "error" | "sheet" | "demo";

export default function Home() {
  const [view, setView] = useState<View>("form");
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [loadingPhrase, setLoadingPhrase] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [lastRequest, setLastRequest] = useState<EncounterRequest | null>(null);
  const [demoKind, setDemoKind] = useState<EncounterKind>("combat");
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cycle loading phrases
  useEffect(() => {
    if (view !== "loading") return;
    setLoadingPhrase(randomLoadingPhrase());
    const interval = setInterval(() => {
      setLoadingPhrase(randomLoadingPhrase());
    }, 3000);
    return () => clearInterval(interval);
  }, [view]);

  // Clean up success timer
  useEffect(() => {
    return () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, []);

  const generate = useCallback(async (req: EncounterRequest) => {
    setLastRequest(req);
    setView("loading");
    setErrorMessage("");

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

      // Brief success screen before showing the sheet
      setView("success");
      successTimer.current = setTimeout(() => {
        setView("sheet");
      }, 1500);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setErrorMessage(message);
      setView("error");
    }
  }, []);

  function handleBack() {
    setView("form");
  }

  function handleTryAgain() {
    if (lastRequest) {
      generate(lastRequest);
    } else {
      setView("form");
    }
  }

  function handleRegenerate() {
    if (lastRequest) {
      generate(lastRequest);
    }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col">
      {/* Form view */}
      {view === "form" && (
        <>
          <header className="flex items-center justify-between border-b border-primary/20 px-6 py-4 lg:px-20 bg-bg-dark/50 backdrop-blur-md sticky top-0 z-50">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-primary text-3xl">
                auto_fix_high
              </span>
              <h2 className="text-xl font-bold font-fantasy tracking-wide">
                Familiar
              </h2>
            </div>
            <button
              onClick={() => setView("demo")}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-accent-gold border border-accent-gold/30 rounded-lg hover:bg-accent-gold/10 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">science</span>
              Demo
            </button>
          </header>
          <EncounterForm onGenerate={generate} />
        </>
      )}

      {/* Loading / Success / Error overlays */}
      {(view === "loading" || view === "success" || view === "error") && (
        <LoadingScreen
          state={view}
          loadingPhrase={loadingPhrase}
          errorMessage={errorMessage}
          onTryAgain={handleTryAgain}
          onBack={handleBack}
        />
      )}

      {/* Sheet view */}
      {view === "sheet" && encounter && (
        <div className="h-screen">
          <EncounterSheet
            encounter={encounter}
            onBack={handleBack}
            onRegenerate={handleRegenerate}
          />
        </div>
      )}

      {/* Demo view */}
      {view === "demo" && (
        <div className="flex flex-col h-screen">
          {/* Demo type switcher bar */}
          <div className="shrink-0 bg-accent-gold/10 border-b border-accent-gold/20 px-4 py-2 flex items-center gap-3">
            <span className="text-accent-gold text-xs font-bold uppercase tracking-widest">
              Demo
            </span>
            <div className="flex gap-1">
              {DEMO_KINDS.map((kind) => (
                <button
                  key={kind}
                  onClick={() => setDemoKind(kind)}
                  className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded transition-colors ${
                    demoKind === kind
                      ? "bg-primary text-white"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {kind}
                </button>
              ))}
            </div>
            <div className="flex-1" />
            <button
              onClick={handleBack}
              className="text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider"
            >
              Close
            </button>
          </div>
          {/* Sheet fills remaining space */}
          <div className="flex-1 min-h-0">
            <EncounterSheet
              encounter={DEMO_ENCOUNTERS[demoKind]}
              onBack={handleBack}
              onRegenerate={() => {}}
            />
          </div>
        </div>
      )}
    </div>
  );
}
