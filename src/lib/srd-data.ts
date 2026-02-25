import { readFileSync } from "fs";
import { join } from "path";

// --- Types ---

export interface Creature {
  name: string;
  size: string;
  type: string;
  tags: string[];
  alignment: string;
  ac: number;
  hp: number;
  cr: number;
  crLabel: string;
  xp: number;
  speed: string;
  source: "monster" | "animal";
  fullText: string;
}

export interface Spell {
  name: string;
  level: number;
  school: string;
  classes: string[];
  castingTime: string;
  range: string;
  duration: string;
  concentration: boolean;
  fullText: string;
}

// --- Parsing helpers ---

function parseCR(crStr: string): number {
  crStr = crStr.trim();
  if (crStr === "1/8") return 0.125;
  if (crStr === "1/4") return 0.25;
  if (crStr === "1/2") return 0.5;
  return parseFloat(crStr) || 0;
}

function parseCreatureFile(
  filePath: string,
  source: "monster" | "animal"
): Creature[] {
  let text: string;
  try {
    text = readFileSync(filePath, "utf-8");
  } catch {
    console.warn(`[srd-data] Could not read ${filePath}`);
    return [];
  }

  const creatures: Creature[] = [];

  // Split on ## headings (level 2 — each creature)
  const sections = text.split(/^## /m).slice(1);

  for (const section of sections) {
    const lines = section.split("\n");
    const name = lines[0].trim();
    const fullText = `## ${section.trim()}`;

    // Parse the italic type line: *Size Type (Tags), Alignment*
    let size = "",
      type = "",
      tags: string[] = [],
      alignment = "";
    const typeLineMatch = section.match(/^\*(.+?)\*$/m);
    if (typeLineMatch) {
      const typeLine = typeLineMatch[1];
      const typeMatch = typeLine.match(
        /^(\w+)\s+(\w+)(?:\s*\(([^)]+)\))?,\s*(.+)$/
      );
      if (typeMatch) {
        size = typeMatch[1];
        type = typeMatch[2];
        tags = typeMatch[3]
          ? typeMatch[3].split(",").map((t) => t.trim())
          : [];
        alignment = typeMatch[4];
      }
    }

    const acMatch = section.match(/\*\*Armor Class:\*\*\s*(\d+)/);
    const ac = acMatch ? parseInt(acMatch[1]) : 0;

    const hpMatch = section.match(/\*\*Hit Points:\*\*\s*(\d+)/);
    const hp = hpMatch ? parseInt(hpMatch[1]) : 0;

    const speedMatch = section.match(/\*\*Speed:\*\*\s*(.+)/);
    const speed = speedMatch ? speedMatch[1].trim() : "";

    // CR line — two formats:
    //   **CR** 10 (XP 5,900, or 7,200 in lair)
    //   **CR** 2 (XP 450; PB +2)
    const crMatch = section.match(
      /\*\*CR\*\*\s*([\d/]+)\s*\(XP\s*([\d,]+)/
    );
    const crLabel = crMatch ? crMatch[1] : "0";
    const cr = parseCR(crLabel);
    const xp = crMatch ? parseInt(crMatch[2].replace(/,/g, "")) : 0;

    creatures.push({
      name,
      size,
      type,
      tags,
      alignment,
      ac,
      hp,
      cr,
      crLabel,
      xp,
      speed,
      source,
      fullText,
    });
  }

  return creatures;
}

function parseSpellFile(filePath: string): Spell[] {
  let text: string;
  try {
    text = readFileSync(filePath, "utf-8");
  } catch {
    console.warn(`[srd-data] Could not read ${filePath}`);
    return [];
  }

  const spells: Spell[] = [];

  // Split on #### headings (level 4 — each spell)
  const sections = text.split(/^#### /m).slice(1);

  for (const section of sections) {
    const lines = section.split("\n");
    // Name might have bold markers: **Aid** → Aid
    const name = lines[0].replace(/\*\*/g, "").trim();
    const fullText = `#### ${section.trim()}`;

    let level = 0,
      school = "",
      classes: string[] = [];

    const spellLineMatch = section.match(/^\*([^*]+)\*$/m);
    if (spellLineMatch) {
      const spellLine = spellLineMatch[1];

      // Cantrip: "School Cantrip (Classes)"
      const cantripMatch = spellLine.match(
        /^(\w+)\s+Cantrip\s*\(([^)]+)\)/
      );
      if (cantripMatch) {
        level = 0;
        school = cantripMatch[1];
        classes = cantripMatch[2].split(",").map((c) => c.trim());
      } else {
        // Leveled: "Level N School (Classes)"
        const levelMatch = spellLine.match(
          /^Level\s+(\d+)\s+(\w+)\s*\(([^)]+)\)/
        );
        if (levelMatch) {
          level = parseInt(levelMatch[1]);
          school = levelMatch[2];
          classes = levelMatch[3].split(",").map((c) => c.trim());
        }
      }
    }

    const ctMatch = section.match(/\*\*Casting Time:\*\*\s*(.+)/);
    const castingTime = ctMatch ? ctMatch[1].trim() : "";

    const rangeMatch = section.match(/\*\*Range:\*\*\s*(.+)/);
    const range = rangeMatch ? rangeMatch[1].trim() : "";

    const durMatch = section.match(/\*\*Duration:\*\*\s*(.+)/);
    const duration = durMatch ? durMatch[1].trim() : "";
    const concentration = duration.toLowerCase().includes("concentration");

    spells.push({
      name,
      level,
      school,
      classes,
      castingTime,
      range,
      duration,
      concentration,
      fullText,
    });
  }

  return spells;
}

// --- Load and export ---

const srdDir = join(process.cwd(), "srd");

export const creatures: Creature[] = [
  ...parseCreatureFile(join(srdDir, "12_MonstersA-Z.md"), "monster"),
  ...parseCreatureFile(join(srdDir, "13_Animals.md"), "animal"),
];

export const spells: Spell[] = parseSpellFile(join(srdDir, "07_Spells.md"));

// Lookup maps (case-insensitive)
export const creaturesByName = new Map(
  creatures.map((c) => [c.name.toLowerCase(), c])
);
export const spellsByName = new Map(
  spells.map((s) => [s.name.toLowerCase(), s])
);

console.log(
  `[srd-data] Loaded ${creatures.length} creatures and ${spells.length} spells`
);
