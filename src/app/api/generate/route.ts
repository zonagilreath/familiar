import { generateWithTools, isRateLimited, srdContent } from "@/lib/gemini";
import type { EncounterRequest } from "@/types/encounter";

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "trivial",
  2: "easy",
  3: "medium",
  4: "hard",
  5: "deadly",
};

const SYSTEM_PROMPT = `You are Familiar, an expert D&D 5e encounter designer.

You produce structured JSON encounter data — not prose, not storytelling. The DM and their players tell the story; you give them the tools to do it.

## Your Resources

You have the D&D 5e 2024 SRD core rules and encounter design guides in your context. For specific creatures and spells, use your tools:
- **searchCreatures**: Find monsters/animals by theme, type, CR range, or keywords
- **getCreature**: Pull the full stat block for a specific creature by name
- **searchSpells**: Find spells by level, school, class, or keywords
- **getSpell**: Pull the full description of a specific spell by name

When building encounters involving combat, search for creatures, then pull full stat blocks for the ones you select. Use XP budgets from the rules to balance.

<srd_reference>
${srdContent}
</srd_reference>

## Output Format

You MUST respond with valid JSON matching this structure. No markdown, no prose — just the JSON object.

{
  "kind": "combat|puzzle|social|skill_challenge|investigation|trap|exploration|chase|hazard",
  "title": "Short evocative title",
  "goal": "The dramatic question — what the PCs are trying to achieve",
  "stakes": {
    "on_success": "Concrete outcome on success",
    "on_failure": "Concrete outcome on failure — must fail forward, never a dead end"
  },
  "spotlight": [SEE SPOTLIGHT INSTRUCTIONS IN THE USER PROMPT],
  "setup": {
    "location_tags": ["terrain tag", ...],
    "time_pressure": "countdown, escalation, or null",
    "opening": "1-2 sentences of mechanical/practical setup — positions, distances, visibility, who acts first. No narration or flavor."
  },
  "payload": { ... type-specific payload ... }
}

### Combat payload:
{
  "forces": [{ "name": "Creature Name", "role": "brute|soldier|artillery|controller|skirmisher|lurker|leader|minion", "count": 2, "cr": 3, "key_abilities": "Brief abilities summary" }],
  "terrain": [{ "name": "Feature name", "type": "cover|obstacle|hazard|interactable", "description": "..." }],
  "tactics": ["How each creature type fights..."],
  "xp_budget": { "total_xp": 1800, "adjusted_xp": 2700, "difficulty": "hard", "party_summary": "4 level-5 PCs" },
  "adjustments": ["How to dial up or down..."]
}

### Puzzle payload:
{
  "description": "What the PCs encounter and the core mechanic",
  "clues": [{ "clue": "...", "discovery_method": "free|skill check|roleplay", "supports": "conclusion name" }],
  "solutions": [{ "approach": "...", "steps": ["..."] }],
  "dcs": [{ "skill": "Arcana", "dc": 15, "result": "What success reveals" }],
  "fail_forward": "What happens on failure"
}

### Social payload:
{
  "npcs": [{ "name": "...", "goal": "...", "objections": ["..."], "incentives": ["..."], "patience": "...", "traits": { "ideals": "...", "bonds": "...", "flaws": "..." } }],
  "discovery_phase": ["What roleplay/Insight reveals..."],
  "dcs": { "friendly": 0, "indifferent": 10, "hostile": 20 },
  "consequences": [{ "outcome": "success|partial|failure", "description": "..." }]
}

### Skill challenge payload:
{
  "successes_required": 5,
  "failures_allowed": 3,
  "skills": [{ "skill": "Athletics", "dc": 14, "narrative": "What this represents" }],
  "complications": [{ "trigger": "At 2 failures", "description": "..." }],
  "partial_success": "Outcome between full success and failure"
}

### Investigation payload:
{
  "nodes": [{ "name": "...", "type": "location|npc|event", "description": "..." }],
  "clues": [{ "clue": "...", "node": "Where found", "points_to": "conclusion", "independently_sufficient": true }],
  "red_herrings": [{ "clue": "...", "node": "...", "plausibility": "Why it seems real" }],
  "connection_summary": "How clues connect nodes"
}

### Trap payload:
{
  "setting": ["Telegraphing signs..."],
  "trigger": "What activates it",
  "mechanism": "How it works",
  "consequence": "What happens when triggered",
  "countermeasures": [{ "method": "...", "details": "..." }]
}

### Exploration payload:
{
  "beacons": [{ "description": "What draws attention", "discovery": "What investigating reveals" }],
  "journey": ["Traversal challenges..."],
  "paths": [{ "name": "...", "risk": "low|medium|high", "reward": "...", "description": "..." }]
}

### Chase payload:
{
  "duration": 5,
  "complications": [{ "roll": 1, "obstacle": "...", "skill": "Athletics", "dc": 14 }],
  "distance_tracking": "How to track positions",
  "win_condition": "...",
  "loss_condition": "..."
}

### Hazard payload:
{
  "skills_required": [{ "skill": "...", "dc": 14, "narrative": "..." }],
  "resource_cost": "What the hazard drains",
  "choice_points": [{ "choice": "...", "trade_off": "..." }],
  "conversion": "What happens on failure"
}

## Quality Rules
- Combat encounters need creatures with distinct tactical roles
- Every encounter needs interactive terrain (at least 2 features in setup/payload)
- Monster tactics must reflect their Intelligence and abilities
- Non-combat encounters need at least 2 viable solution approaches
- Failure must always fail forward
- Each encounter should engage at least 3/4 of the party
- Puzzles need ≥3 clues per conclusion
- Traps need ≥2 countermeasures

IMPORTANT: Only discuss tabletop RPG topics. Decline off-topic requests.`;

function getVarietyInstruction(variety: number): string {
  if (variety <= 0) return "";

  const tiers: string[] = [];

  // Tier 1
  tiers.push(
    "Avoid the most obvious creature choices and encounter setups for these parameters. Prefer less commonly used SRD options over the go-to picks."
  );
  if (variety >= 2) {
    tiers.push(
      "Try unexpected combinations — creatures in atypical tactical roles, unusual pairings that don't normally appear together, environments used in surprising ways."
    );
  }
  if (variety >= 3) {
    tiers.push(
      "Mix creature origins and environments — pull from different monster types or ecosystems. Include at least one element that would make a DM say \"I wouldn't have thought of that.\""
    );
  }
  if (variety >= 4) {
    tiers.push(
      "Subvert expectations for this encounter type — hostile NPCs who aren't straightforwardly evil, traps with novel mechanisms, social encounters with unusual power dynamics. Challenge the DM's assumptions."
    );
  }
  if (variety >= 5) {
    tiers.push(
      "Go genuinely weird — break genre assumptions, combine encounter elements in novel ways, introduce mechanics or scenarios that feel fresh and surprising. Stay mechanically sound and playable, but push creative boundaries hard."
    );
  }

  return "\nCreative variety instructions:\n" + tiers.join("\n");
}

function buildPrompt(req: EncounterRequest): string {
  const parts: string[] = [];

  parts.push("Generate a D&D 5e encounter with the following parameters:");

  if (req.encounter_type) {
    parts.push(`Encounter type: ${req.encounter_type}`);
  }

  parts.push(`Party size: ${req.party_size}`);
  parts.push(`Average level: ${req.average_level}`);
  parts.push(
    `Difficulty: ${DIFFICULTY_LABELS[req.difficulty] || "medium"}`
  );

  if (req.environment) {
    parts.push(`Environment: ${req.environment}`);
  }

  if (req.party_composition.length > 0) {
    const comp = req.party_composition
      .map((p) => `${p.class_name} x${p.count}`)
      .join(", ");
    parts.push(`Party composition: ${comp}`);
  }

  if (req.pacing) {
    parts.push(`Pacing: ${req.pacing}`);
  }

  const varietyInstruction = getVarietyInstruction(req.variety ?? 0);
  if (varietyInstruction) {
    parts.push(varietyInstruction);
  }

  if (req.vibe.trim()) {
    parts.push(`\nAdditional context from the DM:\n${req.vibe.trim()}`);
  }

  // Spotlight instructions — deterministic based on whether classes were provided
  if (req.party_composition.length > 0) {
    const classNames = req.party_composition.map((p) => p.class_name);
    parts.push(
      `\nSpotlight instructions: The party contains these classes: ${classNames.join(", ")}.` +
      ` For the "spotlight" array, produce objects with {"class_name": "...", "hook": "..."}.` +
      ` For each class, identify a specific class feature, skill, or ability that has a concrete application in this encounter.` +
      ` Only include a class if there is a genuine fit — do not force it. Omit classes where nothing stands out.` +
      ` Write hooks as terse third-person DM notes, e.g. "Channel Divinity can break the ghoul paralysis on downed allies" or "Sneak Attack applies every round thanks to the dim light and flanking angles".` +
      ` Never address the player, never use second person, never explain how the class works. The DM already knows. Just flag the specific tactical opportunity.`
    );
  } else {
    parts.push(
      `\nSpotlight instructions: No specific party classes were provided.` +
      ` For the "spotlight" array, produce 2-3 objects with {"role": "...", "hook": "..."}.` +
      ` Use generic roles like "martial", "caster", "healer", "skill monkey", etc.` +
      ` Write hooks as terse third-person DM notes flagging a specific tactical opportunity for that role in this encounter.` +
      ` Never address the player, never use second person. Only include roles with a genuine fit.`
    );
  }

  parts.push(
    "\nRespond with a single JSON object matching the encounter schema. No markdown fences, no extra text."
  );

  return parts.join("\n");
}

export async function POST(request: Request) {
  try {
    // Origin check
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    if (process.env.NODE_ENV === "production") {
      const allowedOrigin = process.env.ALLOWED_ORIGIN;
      if (allowedOrigin && origin && origin !== allowedOrigin) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    const isDev = process.env.NODE_ENV !== "production";
    if (!isDev && !origin && !referer) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Rate limiting
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return Response.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = (await request.json()) as EncounterRequest;

    // Clamp variety to [0, 5]
    body.variety = Math.max(0, Math.min(5, Math.floor(body.variety ?? 0)));

    // Basic validation
    if (
      typeof body.party_size !== "number" ||
      typeof body.average_level !== "number"
    ) {
      return Response.json(
        { error: "party_size and average_level are required numbers" },
        { status: 400 }
      );
    }

    const prompt = buildPrompt(body);

    const text = await generateWithTools(SYSTEM_PROMPT, [
      { role: "user", parts: [{ text: prompt }] },
    ]);

    if (!text) {
      return Response.json(
        { error: "Empty response from model" },
        { status: 502 }
      );
    }

    // Strip markdown code fences if the model wrapped them
    const cleaned = text
      .replace(/^```(?:json)?\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "")
      .trim();

    let encounter;
    try {
      encounter = JSON.parse(cleaned);
    } catch {
      // Trailing commas are the most common Gemini quirk
      const patched = cleaned.replace(/,\s*([}\]])/g, "$1");
      try {
        encounter = JSON.parse(patched);
        console.warn("[Familiar] JSON required trailing-comma fix");
      } catch (e2) {
        console.error(
          "[Familiar] JSON parse failed. First 500 chars:",
          cleaned.slice(0, 500)
        );
        throw e2;
      }
    }

    return Response.json(encounter);
  } catch (err) {
    console.error("[Familiar] Generate error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
