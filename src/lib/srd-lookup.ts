import {
  creatures,
  spells,
  creaturesByName,
  spellsByName,
} from "./srd-data";

// --- Types ---

interface CreatureSearchParams {
  query?: string;
  cr_min?: number;
  cr_max?: number;
  type?: string;
  size?: string;
}

interface SpellSearchParams {
  query?: string;
  level_min?: number;
  level_max?: number;
  school?: string;
  class_name?: string;
  concentration?: boolean;
}

interface CreatureSearchResult {
  name: string;
  cr: string;
  type: string;
  size: string;
  hp: number;
  ac: number;
  speed: string;
  xp: number;
}

interface SpellSearchResult {
  name: string;
  level: number;
  school: string;
  classes: string[];
  castingTime: string;
  concentration: boolean;
}

// --- Creature search/lookup ---

export function searchCreatures(
  params: CreatureSearchParams
): CreatureSearchResult[] {
  let results = creatures;

  if (params.type) {
    const t = params.type.toLowerCase();
    results = results.filter(
      (c) =>
        c.type.toLowerCase() === t ||
        c.tags.some((tag) => tag.toLowerCase() === t)
    );
  }

  if (params.size) {
    const s = params.size.toLowerCase();
    results = results.filter((c) => c.size.toLowerCase() === s);
  }

  if (params.cr_min !== undefined) {
    results = results.filter((c) => c.cr >= params.cr_min!);
  }

  if (params.cr_max !== undefined) {
    results = results.filter((c) => c.cr <= params.cr_max!);
  }

  if (params.query) {
    const terms = params.query.toLowerCase().split(/\s+/);
    results = results.filter((c) => {
      const searchText =
        `${c.name} ${c.type} ${c.tags.join(" ")} ${c.alignment} ${c.fullText}`.toLowerCase();
      return terms.every((term) => searchText.includes(term));
    });
  }

  // Sort by CR ascending for easy scanning
  results.sort((a, b) => a.cr - b.cr);

  return results.slice(0, 20).map((c) => ({
    name: c.name,
    cr: c.crLabel,
    type: `${c.size} ${c.type}${c.tags.length ? ` (${c.tags.join(", ")})` : ""}`,
    size: c.size,
    hp: c.hp,
    ac: c.ac,
    speed: c.speed,
    xp: c.xp,
  }));
}

export function getCreature(name: string): string | null {
  const creature = creaturesByName.get(name.toLowerCase());
  return creature ? creature.fullText : null;
}

// --- Spell search/lookup ---

export function searchSpells(params: SpellSearchParams): SpellSearchResult[] {
  let results = spells;

  if (params.school) {
    const s = params.school.toLowerCase();
    results = results.filter((sp) => sp.school.toLowerCase() === s);
  }

  if (params.class_name) {
    const c = params.class_name.toLowerCase();
    results = results.filter((sp) =>
      sp.classes.some((cls) => cls.toLowerCase() === c)
    );
  }

  if (params.concentration !== undefined) {
    results = results.filter(
      (sp) => sp.concentration === params.concentration
    );
  }

  if (params.level_min !== undefined) {
    results = results.filter((sp) => sp.level >= params.level_min!);
  }

  if (params.level_max !== undefined) {
    results = results.filter((sp) => sp.level <= params.level_max!);
  }

  if (params.query) {
    const terms = params.query.toLowerCase().split(/\s+/);
    results = results.filter((sp) => {
      const searchText =
        `${sp.name} ${sp.school} ${sp.classes.join(" ")} ${sp.fullText}`.toLowerCase();
      return terms.every((term) => searchText.includes(term));
    });
  }

  // Sort by level ascending
  results.sort((a, b) => a.level - b.level);

  return results.slice(0, 20).map((sp) => ({
    name: sp.name,
    level: sp.level,
    school: sp.school,
    classes: sp.classes,
    castingTime: sp.castingTime,
    concentration: sp.concentration,
  }));
}

export function getSpell(name: string): string | null {
  const spell = spellsByName.get(name.toLowerCase());
  return spell ? spell.fullText : null;
}
