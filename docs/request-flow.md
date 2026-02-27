# Familiar: Request Flow

End-to-end walkthrough of what happens when a user generates an encounter.

---

## Phase 1: Frontend Trigger

1. User fills out the `EncounterForm` (encounter type, party size, level, difficulty, environment, party composition, vibe, advanced options)
2. Clicks **GENERATE ENCOUNTER**
3. `EncounterForm.handleSubmit()` calls `onGenerate(req)` with an `EncounterRequest` payload
4. `page.tsx` sets `isLoading = true`, starts cycling loading phrases every 3s

## Phase 2: Network Request

`page.tsx` sends:

```
POST /api/generate
Content-Type: application/json

{
  encounter_type?: EncounterKind,
  party_size: number,
  average_level: number,
  difficulty: 1-5,
  environment: string,
  party_composition: [{ class_name, count }, ...],
  vibe: string,
  pacing?: "quick" | "standard" | "epic",
  loot_intensity?: "sparse" | "standard" | "abundant" | "hoard"
}
```

## Phase 3: API Route — Validation

`src/app/api/generate/route.ts` POST handler:

1. **Origin check** (production only) — rejects mismatched origins → 403
2. **Rate limiting** — extracts IP from `x-forwarded-for`, checks against in-memory map (20 req/min per IP) → 429
3. **Body validation** — parses JSON, confirms `party_size` and `average_level` are numbers → 400

## Phase 4: Prompt Construction

`buildPrompt(req)` assembles a user-facing prompt string from the form data:

```
Generate a D&D 5e encounter with the following parameters:
Encounter type: combat
Party size: 4
Average level: 5
Difficulty: hard
Environment: Dungeon
Party composition: Fighter x1, Wizard x1, Cleric x2

Additional context from the DM:
A dark damp cavern dripping with slime...

Spotlight instructions: The party contains these classes: Fighter, Wizard, Cleric.
For the "spotlight" array, produce objects with {"class_name": "...", "hook": "..."}.
[... class-specific or role-generic instructions ...]

Respond with a single JSON object matching the encounter schema.
```

**Spotlight branching is deterministic** — the code checks `req.party_composition.length` and emits different prompt text depending on whether classes were provided.

## Phase 5: SRD Content & System Prompt

**On server startup** (module-level, runs once):

`gemini.ts → loadSrdContent()` walks `srd/` recursively and concatenates all `.md` files **except** the three tool-backed files:
- `Spells.md` → behind `searchSpells` / `getSpell` tools
- `MonstersA-Z.md` → behind `searchCreatures` / `getCreature` tools
- `Animals.md` → behind `searchCreatures` / `getCreature` tools

**Files loaded inline** (in system prompt): PlayingTheGame, CharacterCreation, CharacterOrigins, all Classes, Equipment, Feats, GameplayToolbox, RulesGlossary, MagicItems, Monsters (index), Encounter_Design, Non_Combat_Encounter_Design

**Also on startup** — `srd-data.ts` parses the three tool-backed files into in-memory data structures:
- `creatures[]` — 329 entries parsed from MonstersA-Z.md + Animals.md (name, size, type, CR, HP, AC, fullText)
- `spells[]` — 338 entries parsed from Spells.md (name, level, school, classes, fullText)
- `creaturesByName` / `spellsByName` — Maps for O(1) lookup

The **system prompt** (defined in `route.ts`) includes:
- Persona & instructions (produce JSON, no prose)
- Tool descriptions (4 functions)
- Full JSON schema for all 9 encounter type payloads
- Quality rules (fail-forward, ≥3 clues for puzzles, ≥2 countermeasures for traps, etc.)
- `<srd_reference>` block containing the inline SRD content

## Phase 6: Cache Check

`gemini.ts → getOrCreateCache(systemPrompt)`:

1. If `cacheDisabled` → skip (returns `""`)
2. If valid cached name exists and hasn't expired → return it (cache hit)
3. Otherwise, create a new cache via `ai.caches.create()`:
   - Bundles: system prompt + tool declarations + seed conversation
   - TTL: 30 minutes
   - On failure (e.g. free tier): sets `cacheDisabled = true` to prevent retries

**Config construction** based on cache result:
- Cache hit → `{ cachedContent: cacheName, maxOutputTokens: 16384 }`
- Cache miss → `{ systemInstruction: prompt, tools: toolDeclarations, maxOutputTokens: 16384 }`

## Phase 7: Gemini Generation Loop

`gemini.ts → generateWithTools(systemPrompt, contents)`:

Runs up to **10 rounds**. Each round:

1. Call `ai.models.generateContent()` (non-streaming) with current contents + config
2. Inspect the response:

**If no parts / empty response:**
- Check `blockReason` → throw safety filter error
- Check `finishReason` (if not STOP) → throw with reason (MAX_TOKENS, SAFETY, etc.)
- Otherwise → throw "Empty response from model"

**If parts contain function calls:**
- Extract all `functionCall` parts
- Log tool call names + args
- Execute each tool locally via `executeTool(name, args)`:
  - `searchCreatures(args)` → filters `creatures[]` by type/size/CR/query, returns top 20 summaries
  - `getCreature(name)` → case-insensitive lookup, returns full markdown stat block
  - `searchSpells(args)` → filters `spells[]` by school/class/level/query, returns top 20 summaries
  - `getSpell(name)` → case-insensitive lookup, returns full markdown spell text
- Append model's tool-call message + tool results to conversation
- **Continue to next round**

**If parts contain text (no tool calls):**
- Concatenate all text parts
- If empty → throw "Model returned empty text"
- **Return the text** (exit loop)

**After 10 rounds with no text response** → throw "too many tool call rounds"

### Typical tool-call sequence for a combat encounter:

```
Round 0: searchCreatures({type: "Undead", cr_min: 2, cr_max: 5}) → 15 results
Round 1: getCreature("Ghast"), getCreature("Shadow") → full stat blocks
Round 2: searchSpells({query: "necrotic"}) → 12 results
Round 3: [text response] → JSON encounter object
```

## Phase 8: Response Processing

Back in `route.ts`:

1. Strip markdown code fences if present (`` ```json ... ``` ``)
2. `JSON.parse(cleaned)` → Encounter object
3. Return `Response.json(encounter)` with 200

On any error → `{ error: message }` with status 400/403/429/500/502

## Phase 9: Frontend Rendering

Back in `page.tsx`:

1. Parse response JSON as `Encounter`
2. Set `encounter` state, switch `view` to `"sheet"`
3. Render `EncounterSheet` component

`EncounterSheet` renders:
- **Header** — "Encounter Run Sheet" + kind badge
- **Execution Summary** card:
  - Goal (italic quote)
  - Stakes (success / fail-forward, side by side)
  - Spotlight hooks (per-class or per-role, with icon + label + hook text)
  - Setup (location tags, time pressure, opening)
- **Type-specific payload** — dispatched by `encounter.kind`:
  - Combat → forces table, terrain features, tactics, XP budget, adjustments
  - Puzzle → description, clues, solutions, DCs, fail-forward
  - Social → NPC profiles, discovery phase, DCs by attitude, consequences
  - Skill challenge → threshold, skills, complications, partial success
  - Investigation → nodes, clues, red herrings, connection map
  - Trap → setting, trigger, mechanism, consequence, countermeasures
  - Exploration → beacons, journey, paths with risk/reward
  - Chase → duration, complications table, distance tracking, win/loss
  - Hazard → skills, resource cost, choice points, conversion
- **Footer** — Back, Regenerate, Export (downloads JSON)

---

## Key Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Spells/monsters behind tool calls, rules inline | Rules are always needed; specific creatures/spells are fetched on demand to keep context window manageable |
| Non-streaming generate (not SSE) | Structured JSON output needs to be complete before parsing; streaming partial JSON is fragile |
| Deterministic prompt branching | Spotlight instructions differ based on whether classes were provided — decided in code, not left to the model |
| Cache with tools baked in | Gemini forbids setting `tools` alongside `cachedContent` in generate calls, so tools must be in the cache |
| `cacheDisabled` flag | Free tier has storage limit = 0; one failure disables retries for the process lifetime |
| In-memory rate limiting | Simple, no external dependencies; resets on server restart (acceptable for this scale) |
