// ---------------------------------------------------------------------------
// Encounter generation request
// ---------------------------------------------------------------------------

export interface PartyMember {
  class_name: string;
  count: number;
}

export interface EncounterRequest {
  encounter_type?: EncounterKind;
  party_size: number;
  average_level: number;
  /** 1-5 scale: 1=trivial, 2=easy, 3=medium, 4=hard, 5=deadly */
  difficulty: number;
  environment: string;
  party_composition: PartyMember[];
  vibe: string;
  pacing?: "quick" | "standard" | "epic";
  /** 0-5 variety scale: 0=standard, 5=wildly creative */
  variety?: number;
}

// ---------------------------------------------------------------------------
// Encounter envelope + type-specific payloads
// ---------------------------------------------------------------------------

/** All recognized encounter kinds. */
export type EncounterKind =
  | "combat"
  | "puzzle"
  | "social"
  | "skill_challenge"
  | "investigation"
  | "trap"
  | "exploration"
  | "chase"
  | "hazard";

// ---------------------------------------------------------------------------
// Common envelope — shared by every encounter
// ---------------------------------------------------------------------------

export interface Stakes {
  on_success: string;
  on_failure: string;
}

export interface Setup {
  /** 2-3 terrain/environment tags, e.g. ["underground", "narrow", "dim light"] */
  location_tags: string[];
  /** Countdown, escalation, opportunity window, or null for none. */
  time_pressure: string | null;
  /** How the encounter opens — dialogue, ambush, discovery, etc. */
  opening: string;
}

/** A spotlight hook tied to a specific class. */
export interface ClassSpotlight {
  class_name: string;
  hook: string;
}

/** A spotlight hook tied to a generic role (when no classes are provided). */
export interface RoleSpotlight {
  role: string;
  hook: string;
}

export type SpotlightEntry = ClassSpotlight | RoleSpotlight;

/** Fields present on every encounter regardless of kind. */
export interface EncounterEnvelope {
  kind: EncounterKind;
  title: string;
  /** The dramatic question — what the PCs are trying to achieve. */
  goal: string;
  stakes: Stakes;
  /** Per-class hooks (when classes provided) or per-role hooks (when not). */
  spotlight: SpotlightEntry[];
  setup: Setup;
}

// ---------------------------------------------------------------------------
// Combat
// ---------------------------------------------------------------------------

export type CreatureRole =
  | "brute"
  | "soldier"
  | "artillery"
  | "controller"
  | "skirmisher"
  | "lurker"
  | "leader"
  | "minion";

export interface CombatCreature {
  name: string;
  role: CreatureRole;
  count: number;
  cr: number;
  key_abilities: string;
}

export interface TerrainFeature {
  name: string;
  /** cover | obstacle | hazard | interactable */
  type: "cover" | "obstacle" | "hazard" | "interactable";
  description: string;
}

export interface XpBudget {
  total_xp: number;
  adjusted_xp: number;
  difficulty: "easy" | "medium" | "hard" | "deadly";
  party_summary: string;
}

export interface CombatPayload {
  forces: CombatCreature[];
  /** At least 2 interactive terrain features. */
  terrain: TerrainFeature[];
  /** Per-creature-type tactics: priority targets, synergies, retreat conditions. */
  tactics: string[];
  xp_budget: XpBudget;
  /** How to dial difficulty up or down. */
  adjustments: string[];
}

// ---------------------------------------------------------------------------
// Puzzle
// ---------------------------------------------------------------------------

export interface PuzzleClue {
  clue: string;
  /** How the PCs find it — free, skill check, roleplay, etc. */
  discovery_method: string;
  /** Which conclusion this clue supports. */
  supports: string;
}

export interface PuzzleSolution {
  approach: string;
  steps: string[];
}

export interface PuzzleDC {
  skill: string;
  dc: number;
  /** What a success reveals — a hint, not a bypass. */
  result: string;
}

export interface PuzzlePayload {
  /** What the PCs encounter and the core mechanic. */
  description: string;
  /** At least 3 clues per intended conclusion. */
  clues: PuzzleClue[];
  /** At least 2 viable solution approaches. */
  solutions: PuzzleSolution[];
  dcs: PuzzleDC[];
  /** What happens on failure — resource cost, harder path, complication. Never a dead end. */
  fail_forward: string;
}

// ---------------------------------------------------------------------------
// Social
// ---------------------------------------------------------------------------

export interface NpcTraits {
  ideals: string;
  bonds: string;
  flaws: string;
}

export interface SocialNpc {
  name: string;
  goal: string;
  objections: string[];
  incentives: string[];
  /** How long the NPC will entertain the conversation. */
  patience: string;
  traits: NpcTraits;
}

export interface SocialDCs {
  friendly: number;
  indifferent: number;
  hostile: number;
}

export interface SocialConsequence {
  outcome: "success" | "partial" | "failure";
  description: string;
}

export interface SocialPayload {
  npcs: SocialNpc[];
  /** What roleplay or Insight reveals about each NPC. */
  discovery_phase: string[];
  dcs: SocialDCs;
  consequences: SocialConsequence[];
}

// ---------------------------------------------------------------------------
// Skill Challenge
// ---------------------------------------------------------------------------

export interface SkillOption {
  skill: string;
  dc: number;
  /** What this skill represents narratively. */
  narrative: string;
}

export interface SkillChallengeComplication {
  /** Triggered at this success or failure count. */
  trigger: string;
  description: string;
}

export interface SkillChallengePayload {
  /** Successes needed. */
  successes_required: number;
  /** Failures allowed before loss. */
  failures_allowed: number;
  skills: SkillOption[];
  complications: SkillChallengeComplication[];
  /** What happens between full success and full failure. */
  partial_success: string;
}

// ---------------------------------------------------------------------------
// Investigation
// ---------------------------------------------------------------------------

export interface InvestigationClue {
  clue: string;
  /** Which node this clue is found at. */
  node: string;
  /** Which conclusion this clue points toward. */
  points_to: string;
  /** Each clue should be independently sufficient to reach its conclusion. */
  independently_sufficient: boolean;
}

export interface InvestigationNode {
  name: string;
  type: "location" | "npc" | "event";
  description: string;
}

export interface RedHerring {
  clue: string;
  node: string;
  /** Why a player might think this is real. */
  plausibility: string;
}

export interface InvestigationPayload {
  nodes: InvestigationNode[];
  /** At least 3 clues per conclusion. */
  clues: InvestigationClue[];
  /** Fewer than real clues. */
  red_herrings: RedHerring[];
  /** Which clues connect which nodes — textual summary. */
  connection_summary: string;
}

// ---------------------------------------------------------------------------
// Trap
// ---------------------------------------------------------------------------

export interface Countermeasure {
  method: string;
  details: string;
}

export interface TrapPayload {
  /** Telegraphing signs the PCs can notice. */
  setting: string[];
  /** What activates the trap. */
  trigger: string;
  /** How the trap works — lets PCs reason about disarming. */
  mechanism: string;
  /** What happens when triggered — beyond just damage. */
  consequence: string;
  /** At least 2 ways to disarm, avoid, or mitigate. */
  countermeasures: Countermeasure[];
}

// ---------------------------------------------------------------------------
// Exploration
// ---------------------------------------------------------------------------

export interface VisualBeacon {
  description: string;
  /** What investigating this beacon reveals. */
  discovery: string;
}

export interface ExplorationPath {
  name: string;
  risk: "low" | "medium" | "high";
  reward: string;
  description: string;
}

export interface ExplorationPayload {
  beacons: VisualBeacon[];
  /** Traversal challenges and minor discoveries along the way. */
  journey: string[];
  /** Multiple routes with different risk/reward profiles. */
  paths: ExplorationPath[];
}

// ---------------------------------------------------------------------------
// Chase
// ---------------------------------------------------------------------------

export interface ChaseComplication {
  roll: number;
  obstacle: string;
  skill: string;
  dc: number;
}

export interface ChasePayload {
  /** Target number of rounds (3-6). */
  duration: number;
  complications: ChaseComplication[];
  /** How to track relative positions. */
  distance_tracking: string;
  win_condition: string;
  loss_condition: string;
}

// ---------------------------------------------------------------------------
// Hazard
// ---------------------------------------------------------------------------

export interface HazardChoicePoint {
  choice: string;
  trade_off: string;
}

export interface HazardPayload {
  /** At least 2-3 different skills to navigate. */
  skills_required: SkillOption[];
  /** What the hazard drains — HP, spell slots, time, items. */
  resource_cost: string;
  /** Decisions with trade-offs. */
  choice_points: HazardChoicePoint[];
  /** What the hazard becomes on failure — combat, chase, etc. */
  conversion: string;
}

// ---------------------------------------------------------------------------
// Discriminated union
// ---------------------------------------------------------------------------

export type Encounter =
  | (EncounterEnvelope & { kind: "combat"; payload: CombatPayload })
  | (EncounterEnvelope & { kind: "puzzle"; payload: PuzzlePayload })
  | (EncounterEnvelope & { kind: "social"; payload: SocialPayload })
  | (EncounterEnvelope & { kind: "skill_challenge"; payload: SkillChallengePayload })
  | (EncounterEnvelope & { kind: "investigation"; payload: InvestigationPayload })
  | (EncounterEnvelope & { kind: "trap"; payload: TrapPayload })
  | (EncounterEnvelope & { kind: "exploration"; payload: ExplorationPayload })
  | (EncounterEnvelope & { kind: "chase"; payload: ChasePayload })
  | (EncounterEnvelope & { kind: "hazard"; payload: HazardPayload });
