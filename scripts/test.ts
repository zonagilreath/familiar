/**
 * Test script for Familiar — run with: npx tsx scripts/test.ts
 *
 * Tests data parsing, search/lookup functions, and optionally the live API.
 * Pass --api to also test the running dev server (must be started separately).
 */

import { creatures, spells } from "../src/lib/srd-data";
import {
  searchCreatures,
  getCreature,
  searchSpells,
  getSpell,
} from "../src/lib/srd-lookup";

const API_URL = process.env.API_URL || "http://localhost:3000";
const runApiTests = process.argv.includes("--api");

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

// --- Data layer tests ---

function testDataParsing() {
  console.log("\n=== Data Parsing ===");

  assert(creatures.length > 300, `Loaded ${creatures.length} creatures (expect 300+)`);
  assert(spells.length > 300, `Loaded ${spells.length} spells (expect 300+)`);

  // Spot-check a known monster
  const aboleth = creatures.find((c) => c.name === "Aboleth");
  assert(!!aboleth, "Aboleth exists");
  if (aboleth) {
    assert(aboleth.cr === 10, `Aboleth CR=10 (got ${aboleth.cr})`);
    assert(aboleth.ac === 17, `Aboleth AC=17 (got ${aboleth.ac})`);
    assert(aboleth.hp === 150, `Aboleth HP=150 (got ${aboleth.hp})`);
    assert(aboleth.size === "Large", `Aboleth size=Large (got ${aboleth.size})`);
    assert(aboleth.type === "Aberration", `Aboleth type=Aberration (got ${aboleth.type})`);
    assert(aboleth.source === "monster", `Aboleth source=monster`);
  }

  // Spot-check a known animal
  const wolf = creatures.find((c) => c.name === "Wolf");
  assert(!!wolf, "Wolf exists");
  if (wolf) {
    assert(wolf.cr === 0.25, `Wolf CR=1/4 (got ${wolf.cr})`);
    assert(wolf.source === "animal", `Wolf source=animal`);
  }

  // Spot-check fractional CRs
  const crValues = creatures.map((c) => c.cr);
  assert(crValues.includes(0.125), "CR 1/8 creatures exist");
  assert(crValues.includes(0.25), "CR 1/4 creatures exist");
  assert(crValues.includes(0.5), "CR 1/2 creatures exist");

  // Spot-check a known spell
  const fireball = spells.find((s) => s.name === "Fireball");
  assert(!!fireball, "Fireball exists");
  if (fireball) {
    assert(fireball.level === 3, `Fireball level=3 (got ${fireball.level})`);
    assert(fireball.school === "Evocation", `Fireball school=Evocation (got ${fireball.school})`);
    assert(fireball.classes.includes("Sorcerer"), "Fireball available to Sorcerer");
    assert(fireball.classes.includes("Wizard"), "Fireball available to Wizard");
    assert(!fireball.concentration, "Fireball is not concentration");
  }

  // Spot-check a cantrip
  const firebolt = spells.find((s) => s.name === "Fire Bolt");
  assert(!!firebolt, "Fire Bolt exists");
  if (firebolt) {
    assert(firebolt.level === 0, `Fire Bolt level=0 (got ${firebolt.level})`);
  }

  // Check concentration detection
  const conc = spells.find((s) => s.name === "Bless");
  assert(!!conc, "Bless exists");
  if (conc) {
    assert(conc.concentration === true, "Bless is concentration");
  }
}

function testSearch() {
  console.log("\n=== Search Functions ===");

  // Creature search by type
  const undead = searchCreatures({ type: "Undead" });
  assert(undead.length > 0, `Undead type search returned ${undead.length} results`);
  assert(
    undead.every((c) => c.type.includes("Undead")),
    "All undead results have Undead type"
  );

  // Creature search by CR range
  const cr3to5 = searchCreatures({ cr_min: 3, cr_max: 5 });
  assert(cr3to5.length > 0, `CR 3-5 search returned ${cr3to5.length} results`);

  // Creature search by keyword
  const dragons = searchCreatures({ query: "dragon" });
  assert(dragons.length > 0, `Dragon keyword search returned ${dragons.length} results`);

  // Combined search
  const undeadLow = searchCreatures({ type: "Undead", cr_min: 0, cr_max: 3 });
  assert(undeadLow.length > 0, `Undead CR 0-3 search returned ${undeadLow.length} results`);

  // Creature search by size
  const huge = searchCreatures({ size: "Huge" });
  assert(huge.length > 0, `Huge size search returned ${huge.length} results`);

  // Creature lookup by name
  const wight = getCreature("Wight");
  assert(!!wight, "getCreature('Wight') found");
  assert(wight?.includes("## Wight") === true, "Wight stat block starts with heading");
  assert(wight?.includes("**CR**") === true, "Wight stat block contains CR");

  // Case-insensitive lookup
  const wightLower = getCreature("wight");
  assert(!!wightLower, "getCreature('wight') works case-insensitive");

  // Missing creature
  const missing = getCreature("Nonexistent Monster");
  assert(missing === null, "getCreature returns null for missing creature");

  // Spell search by level
  const cantrips = searchSpells({ level_min: 0, level_max: 0 });
  assert(cantrips.length > 0, `Cantrip search returned ${cantrips.length} results`);
  assert(
    cantrips.every((s) => s.level === 0),
    "All cantrip results are level 0"
  );

  // Spell search by class
  const clericSpells = searchSpells({ class_name: "Cleric" });
  assert(clericSpells.length > 0, `Cleric spell search returned ${clericSpells.length} results`);

  // Spell search by school
  const necro = searchSpells({ school: "Necromancy" });
  assert(necro.length > 0, `Necromancy school search returned ${necro.length} results`);

  // Spell search by concentration
  const concSpells = searchSpells({ concentration: true, level_max: 3 });
  assert(concSpells.length > 0, `Concentration spells L0-3 returned ${concSpells.length} results`);

  // Spell keyword search
  const fireSpells = searchSpells({ query: "fire" });
  assert(fireSpells.length > 0, `Fire keyword spell search returned ${fireSpells.length} results`);

  // Spell lookup by name
  const shield = getSpell("Shield");
  assert(!!shield, "getSpell('Shield') found");
  assert(shield?.includes("Reaction") === true, "Shield spell mentions Reaction");

  // Missing spell
  const missingSpell = getSpell("Nonexistent Spell");
  assert(missingSpell === null, "getSpell returns null for missing spell");
}

// --- API tests (optional, requires running server) ---

async function parseSSE(response: Response): Promise<string> {
  const text = await response.text();
  let result = "";
  for (const line of text.split("\n")) {
    if (line.startsWith("data: ") && line !== "data: [DONE]") {
      try {
        const parsed = JSON.parse(line.slice(6));
        if (parsed.text) result += parsed.text;
        if (parsed.error) return `[ERROR] ${parsed.error}`;
      } catch {
        // skip unparseable lines
      }
    }
  }
  return result;
}

async function testApi() {
  console.log("\n=== API Tests ===");

  // Test 1: Basic chat
  try {
    const res = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "What is a D20 Test?" }],
      }),
    });
    const text = await parseSSE(res);
    assert(res.ok, `Basic chat returned ${res.status}`);
    assert(text.length > 50, `Basic chat response length=${text.length}`);
    assert(!text.startsWith("[ERROR]"), `Basic chat no error: ${text.substring(0, 80)}...`);
  } catch (e) {
    assert(false, `Basic chat failed: ${e}`);
  }

  // Test 2: Query that should trigger tool calls
  try {
    const res = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content:
              "Look up the full stat block for a Wight using your tools and tell me its AC and HP.",
          },
        ],
      }),
    });
    const text = await parseSSE(res);
    assert(res.ok, `Tool-call chat returned ${res.status}`);
    assert(text.length > 50, `Tool-call response length=${text.length}`);
    assert(!text.startsWith("[ERROR]"), `Tool-call no error: ${text.substring(0, 80)}...`);
    // Check that the response references actual stats
    const mentionsAC = text.includes("14") || text.includes("AC");
    const mentionsHP = text.includes("45") || text.includes("HP") || text.includes("Hit Points");
    assert(mentionsAC || mentionsHP, "Tool-call response includes stat data");
  } catch (e) {
    assert(false, `Tool-call chat failed: ${e}`);
  }

  // Test 3: Encounter generation
  try {
    const res = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content:
              "Search for CR 2-4 undead creatures and build a quick encounter for 4 level-3 PCs.",
          },
        ],
      }),
    });
    const text = await parseSSE(res);
    assert(res.ok, `Encounter chat returned ${res.status}`);
    assert(text.length > 100, `Encounter response length=${text.length}`);
    assert(!text.startsWith("[ERROR]"), `Encounter no error: ${text.substring(0, 80)}...`);
  } catch (e) {
    assert(false, `Encounter chat failed: ${e}`);
  }
}

// --- Run ---

async function main() {
  console.log("Familiar — Test Suite\n");

  testDataParsing();
  testSearch();

  if (runApiTests) {
    console.log(`\nRunning API tests against ${API_URL}...`);
    await testApi();
  } else {
    console.log("\nSkipping API tests (pass --api to enable, requires running dev server)");
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
