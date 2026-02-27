# Familiar

AI-powered D&D 5e encounter generator for dungeon masters. Fill out a form (or don't — everything's optional), and Familiar produces a structured, ready-to-run encounter sheet with creature rosters, puzzle mechanics, NPC profiles, trap schematics, and more.

Built on Gemini 2.5 Flash with the full SRD loaded as context, plus tool-calling for on-demand creature and spell lookups.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Get a free API key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and add it to `.env.local`:
   ```
   GOOGLE_GENERATIVE_AI_API_KEY=your-key-here
   ```

3. Run the dev server:
   ```
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## How It Works

### The Form

The input form lets you dial in as much or as little as you want:

- **Encounter type** — combat, puzzle, social, or trap (more planned)
- **Party size & level** — used for CR balancing and difficulty math
- **Difficulty** — trivial through deadly
- **Environment** — dungeon, forest, urban, etc.
- **Party composition** — specific classes, so the AI can write targeted spotlight hooks
- **Pacing** — quick, standard, or epic/multi-stage
- **The Vibe** — freeform text for atmosphere, specific monsters, narrative hooks, or anything else

Everything is optional. You can hit Generate with a blank form and get a complete encounter, or you can fill in every field and a paragraph of flavor text.

### The Generation Pipeline

When you hit Generate:

1. **Prompt assembly** — `buildPrompt()` deterministically constructs the user prompt from form data. If you provided party classes, it asks for class-specific spotlight hooks; if not, it asks for generic role-based hooks (martial, caster, healer, etc.). This branching happens in code, not in the AI prompt, so the output format is predictable.

2. **Gemini context cache** — The system prompt (~18KB of SRD rules + encounter design guidelines + JSON schema) is cached server-side with a 30-minute TTL. Subsequent requests reference the cache instead of re-transmitting the full context. This cuts input token cost significantly.

3. **Tool-call loop** — Gemini can call four tools during generation: `searchCreatures`, `getCreature`, `searchSpells`, and `getSpell`. These query the parsed SRD data in memory (329 creatures, 338 spells). The loop runs up to 10 rounds — the model searches, retrieves stat blocks, and incorporates them into the encounter. All tool execution is local (no external API calls).

4. **JSON extraction** — The model returns structured JSON matching a discriminated union type. A lightweight fix strips trailing commas (a common Gemini quirk). The parsed result is validated and returned to the client.

5. **Rendering** — The client renders the encounter as a structured "run sheet" optimized for at-the-table use: goal and stakes up top, then setup, then the primary encounter content (roster, puzzle mechanics, NPC profiles, etc.), then auxiliary info like spotlight hooks and terrain.

### The Output

Every encounter shares a common envelope:

- **Goal** — the dramatic question the PCs are trying to answer
- **Stakes** — what success looks like, and what failure looks like (always fail-forward, never a dead end)
- **Setup** — location tags, time pressure, and a mechanical opening (positions, distances, who acts first)
- **Spotlight hooks** — per-class or per-role notes for the DM flagging specific tactical opportunities

Then type-specific content:

| Type | Primary Content |
|------|----------------|
| **Combat** | Creature roster with roles/CR/abilities, XP budget, terrain features, tactics, difficulty adjustments |
| **Puzzle** | Core mechanic description, clues (with discovery methods), multiple solution paths, DCs, fail-forward |
| **Social** | NPC profiles (goals, objections, incentives, patience, personality traits), DCs by attitude, consequences |
| **Trap** | Telegraphing signs, trigger, mechanism, consequence, countermeasures (always at least 2) |

## Architecture Decisions

### Hybrid SRD Strategy

The SRD is split into two tiers:

- **Inline** (~18KB) — Core rules, classes, equipment, feats, encounter design guidelines. Loaded into the system prompt and cached. The model always has these available.
- **Tool-backed** — Creatures (329), spells (338), and animals. Too large to inline, but searchable and retrievable via function calling. The model asks for what it needs.

This keeps the context window manageable while giving the model access to the full SRD. The inline content is everything the model needs to *design* an encounter; the tool-backed content is what it needs to *populate* one with specific creatures and spells.

### Structured JSON Over Streaming

The generate endpoint buffers the full response and parses it as JSON, rather than streaming partial text. This is a deliberate tradeoff:

- **Upside**: Guaranteed valid JSON, type-safe rendering, no partial-parse complexity
- **Downside**: The user waits for the full response before seeing anything

The loading screen with cycling D&D-themed phrases ("Consulting the oracle...", "Bribing mimics...") covers the wait. A separate `/api/chat` endpoint exists for streaming text if needed.

### Deterministic Prompt Branching

Whether the prompt asks for class-specific or role-based spotlight hooks is decided in code based on whether `party_composition` has entries. The model doesn't choose — it gets told exactly which format to use. This prevents the model from guessing wrong or mixing formats.

### Gemini Context Caching

Gemini's caching API lets you pre-load content (system prompt, tool definitions, seed conversation) and reference it by name in subsequent requests. The cache has a 30-minute TTL and is recreated lazily on expiry. If cache creation fails (e.g., free tier limits), the system falls back to uncached requests transparently.

### Quality Rules in the Prompt

The system prompt embeds specific quality constraints:

- Combat encounters must include interactive terrain features
- Puzzles must have at least 3 clues per conclusion and at least 2 solution paths
- Traps must have at least 2 countermeasures
- Failure always fails forward — it creates complications, not dead ends
- Encounters should engage at least 3/4 of the party

These rules are baked into the prompt, not enforced in code. The model follows them reliably enough that post-validation isn't needed.

## Stack

- **Next.js 16** + TypeScript (strict mode)
- **Gemini 2.5 Flash** via `@google/genai` SDK
- **Tailwind CSS 4** with custom dark theme
- **Material Symbols Outlined** for icons
- **Inter** (sans) + **Lora** (serif) fonts

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── generate/route.ts   ← structured encounter generation
│   │   └── chat/route.ts       ← streaming chat (secondary)
│   ├── page.tsx                 ← view controller (form/loading/sheet/demo)
│   ├── layout.tsx               ← root layout, fonts, metadata
│   └── globals.css              ← Tailwind theme (purple/gold dark mode)
├── components/
│   ├── EncounterForm.tsx        ← input form
│   ├── EncounterSheet.tsx       ← output run sheet
│   └── LoadingScreen.tsx        ← loading/success/error states
├── lib/
│   ├── gemini.ts                ← Gemini client, caching, tool loop, rate limiting
│   ├── srd-data.ts              ← SRD markdown parsing into typed data structures
│   ├── srd-lookup.ts            ← creature/spell search and retrieval
│   └── demo-encounters.ts       ← mock data for demo mode
└── types/
    └── encounter.ts             ← discriminated union for all encounter types

srd/                             ← D&D 5e SRD markdown files (~26K lines)
docs/
    └── request-flow.md          ← detailed 9-phase request flow documentation
```
