"use client";

import { useState } from "react";
import type { EncounterKind, EncounterRequest, PartyMember } from "@/types/encounter";

const ENCOUNTER_TYPES: { kind: EncounterKind; label: string; icon: string }[] = [
  { kind: "combat", label: "Combat", icon: "swords" },
  { kind: "puzzle", label: "Puzzle", icon: "extension" },
  { kind: "social", label: "Social", icon: "forum" },
  { kind: "exploration", label: "Exploration", icon: "explore" },
  { kind: "trap", label: "Trap", icon: "warning" },
  { kind: "investigation", label: "Investigation", icon: "search" },
  { kind: "chase", label: "Chase", icon: "directions_run" },
  { kind: "hazard", label: "Hazard", icon: "thunderstorm" },
  { kind: "skill_challenge", label: "Skill Challenge", icon: "fitness_center" },
];

const ENVIRONMENTS = [
  "Dungeon",
  "Forest",
  "Underdark",
  "Urban",
  "Coastal",
  "Mountain",
  "Desert",
  "Swamp",
  "Arctic",
  "Planar",
];

const CLASSES = [
  "Barbarian",
  "Bard",
  "Cleric",
  "Druid",
  "Fighter",
  "Monk",
  "Paladin",
  "Ranger",
  "Rogue",
  "Sorcerer",
  "Warlock",
  "Wizard",
];

const DIFFICULTY_LABELS = ["Trivial", "Easy", "Medium", "Hard", "Deadly"];

interface EncounterFormProps {
  onGenerate: (req: EncounterRequest) => void;
  isLoading: boolean;
  loadingPhrase: string;
}

export default function EncounterForm({
  onGenerate,
  isLoading,
  loadingPhrase,
}: EncounterFormProps) {
  const [encounterType, setEncounterType] = useState<EncounterKind | undefined>();
  const [partySize, setPartySize] = useState(4);
  const [averageLevel, setAverageLevel] = useState(5);
  const [difficulty, setDifficulty] = useState(3);
  const [environment, setEnvironment] = useState("Dungeon");
  const [party, setParty] = useState<PartyMember[]>([]);
  const [vibe, setVibe] = useState("");
  const [pacing, setPacing] = useState<"quick" | "standard" | "epic">("standard");
  const [lootIntensity, setLootIntensity] = useState<"sparse" | "standard" | "abundant" | "hoard">("standard");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false);

  function addClass(className: string) {
    const existing = party.find((p) => p.class_name === className);
    if (existing) {
      setParty(
        party.map((p) =>
          p.class_name === className ? { ...p, count: p.count + 1 } : p
        )
      );
    } else {
      setParty([...party, { class_name: className, count: 1 }]);
    }
    setShowClassPicker(false);
  }

  function removeClass(className: string) {
    setParty(party.filter((p) => p.class_name !== className));
  }

  function handleSubmit() {
    onGenerate({
      encounter_type: encounterType,
      party_size: partySize,
      average_level: averageLevel,
      difficulty,
      environment,
      party_composition: party,
      vibe,
      pacing,
      loot_intensity: lootIntensity,
    });
  }

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-12">
      <div className="mb-10">
        <h1 className="text-4xl lg:text-5xl font-black font-fantasy text-slate-100 mb-2">
          Encounter Generator
        </h1>
        <p className="text-slate-400 text-lg">
          Use controls, text, or both. Everything is optional.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Structured inputs */}
        <div className="lg:col-span-7 space-y-10">
          {/* Encounter Type */}
          <section>
            <h2 className="text-xl font-bold font-fantasy text-accent-gold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">auto_awesome</span>
              Encounter Type
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {ENCOUNTER_TYPES.map((t) => (
                <button
                  key={t.kind}
                  onClick={() =>
                    setEncounterType(encounterType === t.kind ? undefined : t.kind)
                  }
                  className={`flex flex-col items-center justify-center p-3 aspect-square rounded-xl border-2 transition-all active:scale-95 ${
                    encounterType === t.kind
                      ? "border-primary bg-primary/20 ring-1 ring-primary"
                      : "border-primary/20 bg-primary/5 hover:border-primary/50"
                  }`}
                >
                  <span className="material-symbols-outlined text-2xl text-primary mb-1">
                    {t.icon}
                  </span>
                  <span className="font-bold text-[10px] uppercase tracking-widest">
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Party stats + difficulty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              {/* Party size */}
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">
                  Party Size
                </label>
                <div className="flex items-center gap-4 bg-primary/10 rounded-lg p-2 w-fit border border-primary/20">
                  <button
                    onClick={() => setPartySize(Math.max(1, partySize - 1))}
                    className="size-8 flex items-center justify-center rounded bg-primary/20 hover:bg-primary/40 text-primary"
                  >
                    <span className="material-symbols-outlined">remove</span>
                  </button>
                  <span className="text-xl font-bold w-8 text-center">
                    {partySize}
                  </span>
                  <button
                    onClick={() => setPartySize(Math.min(10, partySize + 1))}
                    className="size-8 flex items-center justify-center rounded bg-primary text-white"
                  >
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
              </div>

              {/* Average level */}
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">
                  Average Level
                </label>
                <div className="flex items-center gap-4 bg-primary/10 rounded-lg p-2 w-fit border border-primary/20">
                  <button
                    onClick={() =>
                      setAverageLevel(Math.max(1, averageLevel - 1))
                    }
                    className="size-8 flex items-center justify-center rounded bg-primary/20 hover:bg-primary/40 text-primary"
                  >
                    <span className="material-symbols-outlined">remove</span>
                  </button>
                  <span className="text-xl font-bold w-8 text-center">
                    {averageLevel}
                  </span>
                  <button
                    onClick={() =>
                      setAverageLevel(Math.min(20, averageLevel + 1))
                    }
                    className="size-8 flex items-center justify-center rounded bg-primary text-white"
                  >
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Difficulty */}
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">
                  Difficulty
                </label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={difficulty}
                  onChange={(e) => setDifficulty(Number(e.target.value))}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs mt-2 font-bold text-slate-500">
                  {DIFFICULTY_LABELS.map((label, i) => (
                    <span
                      key={label}
                      className={difficulty === i + 1 ? "text-primary" : ""}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Environment */}
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">
                  Environment
                </label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  className="w-full bg-primary/10 border border-primary/20 rounded-lg py-3 px-4 focus:ring-primary focus:border-primary text-slate-100"
                >
                  {ENVIRONMENTS.map((env) => (
                    <option key={env} value={env}>
                      {env}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Party composition */}
          <section>
            <h2 className="text-lg font-bold font-fantasy text-slate-200 mb-4">
              Party Composition
            </h2>
            <div className="flex flex-wrap gap-2">
              {party.map((p) => (
                <div
                  key={p.class_name}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-slate-200 text-xs font-bold uppercase tracking-tight"
                >
                  {p.class_name} x{p.count}
                  <button
                    onClick={() => removeClass(p.class_name)}
                    className="hover:text-accent-gold"
                  >
                    <span className="material-symbols-outlined text-xs">
                      close
                    </span>
                  </button>
                </div>
              ))}
              <div className="relative">
                <button
                  onClick={() => setShowClassPicker(!showClassPicker)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-dashed border-primary/40 text-primary hover:bg-primary/10 transition-colors text-xs font-bold uppercase tracking-tight"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Add Class
                </button>
                {showClassPicker && (
                  <div className="absolute top-full left-0 mt-2 z-20 bg-card-dark border border-primary/30 rounded-lg shadow-xl p-2 grid grid-cols-2 gap-1 min-w-[200px]">
                    {CLASSES.map((cls) => (
                      <button
                        key={cls}
                        onClick={() => addClass(cls)}
                        className="text-left text-sm px-3 py-1.5 rounded hover:bg-primary/20 text-slate-200"
                      >
                        {cls}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Advanced options */}
          <div className="bg-primary/5 rounded-xl border border-primary/20 overflow-hidden">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full p-4 hover:bg-primary/10 transition-colors"
            >
              <span className="font-bold text-slate-200 flex items-center gap-2">
                <span className="material-symbols-outlined">settings</span>
                Advanced Options
              </span>
              <span
                className={`material-symbols-outlined transition-transform ${showAdvanced ? "rotate-180" : ""}`}
              >
                expand_more
              </span>
            </button>
            {showAdvanced && (
              <div className="p-6 border-t border-primary/20 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">
                      Length / Pacing
                    </label>
                    <select
                      value={pacing}
                      onChange={(e) =>
                        setPacing(
                          e.target.value as "quick" | "standard" | "epic"
                        )
                      }
                      className="w-full bg-bg-dark border border-primary/20 rounded-lg py-2 px-3 text-sm text-slate-100"
                    >
                      <option value="quick">Quick Encounter</option>
                      <option value="standard">Standard</option>
                      <option value="epic">Epic / Multi-stage</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">
                      Loot Intensity
                    </label>
                    <select
                      value={lootIntensity}
                      onChange={(e) =>
                        setLootIntensity(
                          e.target.value as
                            | "sparse"
                            | "standard"
                            | "abundant"
                            | "hoard"
                        )
                      }
                      className="w-full bg-bg-dark border border-primary/20 rounded-lg py-2 px-3 text-sm text-slate-100"
                    >
                      <option value="sparse">Sparse</option>
                      <option value="standard">Standard</option>
                      <option value="abundant">Abundant</option>
                      <option value="hoard">Hoard Potential</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Vibe + action */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="flex-1 flex flex-col bg-primary/5 rounded-2xl border border-primary/10 p-8">
            <h2 className="text-xl font-bold font-fantasy text-accent-gold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">history_edu</span>
              The Vibe
            </h2>
            <p className="text-sm text-slate-400 mb-4 italic">
              Optional: Describe the atmosphere, specific monsters, or narrative
              hooks you want to include.
            </p>
            <textarea
              value={vibe}
              onChange={(e) => setVibe(e.target.value)}
              className="flex-1 w-full bg-bg-dark/50 border border-primary/20 rounded-xl p-4 text-slate-100 placeholder:text-slate-600 focus:ring-primary focus:border-primary resize-none min-h-[200px]"
              placeholder="E.g. A dark damp cavern dripping with slime. Shadowy stalkers hunt from the ceiling. A faint smell of ozone..."
            />
          </div>

          <div className="space-y-4">
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full py-6 rounded-2xl bg-primary text-white font-black text-xl font-fantasy tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:hover:scale-100"
            >
              {isLoading ? (
                <span className="text-base font-display italic tracking-normal font-medium">
                  {loadingPhrase}...
                </span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-3xl">
                    auto_fix_high
                  </span>
                  GENERATE ENCOUNTER
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
