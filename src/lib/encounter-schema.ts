/**
 * Gemini responseJsonSchema definitions for structured encounter output.
 *
 * When the requested encounter kind is known we return a tight schema so the
 * model is constrained to the correct payload shape.  When the kind is
 * unspecified we fall back to a loose payload (`"type": "object"`) — the
 * system prompt still contains the full schema docs so output quality is
 * preserved.
 */

import type { EncounterKind } from "@/types/encounter";

// ---------------------------------------------------------------------------
// Shared fragments
// ---------------------------------------------------------------------------

const STRING = { type: "string" } as const;
const NUMBER = { type: "number" } as const;
const INTEGER = { type: "integer" } as const;
const STRING_ARRAY = { type: "array", items: STRING } as const;

const STAKES = {
  type: "object",
  properties: {
    on_success: STRING,
    on_failure: STRING,
  },
  required: ["on_success", "on_failure"],
} as const;

const SPOTLIGHT_ITEM = {
  type: "object",
  properties: {
    class_name: STRING,
    role: STRING,
    hook: STRING,
  },
  required: ["hook"],
} as const;

const SETUP = {
  type: "object",
  properties: {
    location_tags: STRING_ARRAY,
    time_pressure: STRING,
    opening: STRING,
  },
  required: ["location_tags", "time_pressure", "opening"],
} as const;

const SKILL_OPTION = {
  type: "object",
  properties: {
    skill: STRING,
    dc: INTEGER,
    narrative: STRING,
  },
  required: ["skill", "dc", "narrative"],
} as const;

// ---------------------------------------------------------------------------
// Payload schemas — one per encounter kind
// ---------------------------------------------------------------------------

const COMBAT_PAYLOAD = {
  type: "object",
  properties: {
    forces: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: STRING,
          role: {
            type: "string",
            enum: [
              "brute",
              "soldier",
              "artillery",
              "controller",
              "skirmisher",
              "lurker",
              "leader",
              "minion",
            ],
          },
          count: INTEGER,
          cr: NUMBER,
          key_abilities: STRING,
        },
        required: ["name", "role", "count", "cr", "key_abilities"],
      },
    },
    terrain: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: STRING,
          type: {
            type: "string",
            enum: ["cover", "obstacle", "hazard", "interactable"],
          },
          description: STRING,
        },
        required: ["name", "type", "description"],
      },
    },
    tactics: STRING_ARRAY,
    xp_budget: {
      type: "object",
      properties: {
        total_xp: INTEGER,
        adjusted_xp: INTEGER,
        difficulty: {
          type: "string",
          enum: ["easy", "medium", "hard", "deadly"],
        },
        party_summary: STRING,
      },
      required: ["total_xp", "adjusted_xp", "difficulty", "party_summary"],
    },
    adjustments: STRING_ARRAY,
  },
  required: ["forces", "terrain", "tactics", "xp_budget", "adjustments"],
} as const;

const PUZZLE_PAYLOAD = {
  type: "object",
  properties: {
    description: STRING,
    clues: {
      type: "array",
      items: {
        type: "object",
        properties: {
          clue: STRING,
          discovery_method: STRING,
          supports: STRING,
        },
        required: ["clue", "discovery_method", "supports"],
      },
    },
    solutions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          approach: STRING,
          steps: STRING_ARRAY,
        },
        required: ["approach", "steps"],
      },
    },
    dcs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          skill: STRING,
          dc: INTEGER,
          result: STRING,
        },
        required: ["skill", "dc", "result"],
      },
    },
    fail_forward: STRING,
  },
  required: ["description", "clues", "solutions", "dcs", "fail_forward"],
} as const;

const SOCIAL_PAYLOAD = {
  type: "object",
  properties: {
    npcs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: STRING,
          goal: STRING,
          objections: STRING_ARRAY,
          incentives: STRING_ARRAY,
          patience: STRING,
          traits: {
            type: "object",
            properties: {
              ideals: STRING,
              bonds: STRING,
              flaws: STRING,
            },
            required: ["ideals", "bonds", "flaws"],
          },
        },
        required: [
          "name",
          "goal",
          "objections",
          "incentives",
          "patience",
          "traits",
        ],
      },
    },
    discovery_phase: STRING_ARRAY,
    dcs: {
      type: "object",
      properties: {
        friendly: INTEGER,
        indifferent: INTEGER,
        hostile: INTEGER,
      },
      required: ["friendly", "indifferent", "hostile"],
    },
    consequences: {
      type: "array",
      items: {
        type: "object",
        properties: {
          outcome: { type: "string", enum: ["success", "partial", "failure"] },
          description: STRING,
        },
        required: ["outcome", "description"],
      },
    },
  },
  required: ["npcs", "discovery_phase", "dcs", "consequences"],
} as const;

const SKILL_CHALLENGE_PAYLOAD = {
  type: "object",
  properties: {
    successes_required: INTEGER,
    failures_allowed: INTEGER,
    skills: { type: "array", items: SKILL_OPTION },
    complications: {
      type: "array",
      items: {
        type: "object",
        properties: {
          trigger: STRING,
          description: STRING,
        },
        required: ["trigger", "description"],
      },
    },
    partial_success: STRING,
  },
  required: [
    "successes_required",
    "failures_allowed",
    "skills",
    "complications",
    "partial_success",
  ],
} as const;

const INVESTIGATION_PAYLOAD = {
  type: "object",
  properties: {
    nodes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: STRING,
          type: { type: "string", enum: ["location", "npc", "event"] },
          description: STRING,
        },
        required: ["name", "type", "description"],
      },
    },
    clues: {
      type: "array",
      items: {
        type: "object",
        properties: {
          clue: STRING,
          node: STRING,
          points_to: STRING,
          independently_sufficient: { type: "boolean" },
        },
        required: ["clue", "node", "points_to", "independently_sufficient"],
      },
    },
    red_herrings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          clue: STRING,
          node: STRING,
          plausibility: STRING,
        },
        required: ["clue", "node", "plausibility"],
      },
    },
    connection_summary: STRING,
  },
  required: ["nodes", "clues", "red_herrings", "connection_summary"],
} as const;

const TRAP_PAYLOAD = {
  type: "object",
  properties: {
    setting: STRING_ARRAY,
    trigger: STRING,
    mechanism: STRING,
    consequence: STRING,
    countermeasures: {
      type: "array",
      items: {
        type: "object",
        properties: {
          method: STRING,
          details: STRING,
        },
        required: ["method", "details"],
      },
    },
  },
  required: [
    "setting",
    "trigger",
    "mechanism",
    "consequence",
    "countermeasures",
  ],
} as const;

const EXPLORATION_PAYLOAD = {
  type: "object",
  properties: {
    beacons: {
      type: "array",
      items: {
        type: "object",
        properties: {
          description: STRING,
          discovery: STRING,
        },
        required: ["description", "discovery"],
      },
    },
    journey: STRING_ARRAY,
    paths: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: STRING,
          risk: { type: "string", enum: ["low", "medium", "high"] },
          reward: STRING,
          description: STRING,
        },
        required: ["name", "risk", "reward", "description"],
      },
    },
  },
  required: ["beacons", "journey", "paths"],
} as const;

const CHASE_PAYLOAD = {
  type: "object",
  properties: {
    duration: INTEGER,
    complications: {
      type: "array",
      items: {
        type: "object",
        properties: {
          roll: INTEGER,
          obstacle: STRING,
          skill: STRING,
          dc: INTEGER,
        },
        required: ["roll", "obstacle", "skill", "dc"],
      },
    },
    distance_tracking: STRING,
    win_condition: STRING,
    loss_condition: STRING,
  },
  required: [
    "duration",
    "complications",
    "distance_tracking",
    "win_condition",
    "loss_condition",
  ],
} as const;

const HAZARD_PAYLOAD = {
  type: "object",
  properties: {
    skills_required: { type: "array", items: SKILL_OPTION },
    resource_cost: STRING,
    choice_points: {
      type: "array",
      items: {
        type: "object",
        properties: {
          choice: STRING,
          trade_off: STRING,
        },
        required: ["choice", "trade_off"],
      },
    },
    conversion: STRING,
  },
  required: ["skills_required", "resource_cost", "choice_points", "conversion"],
} as const;

// ---------------------------------------------------------------------------
// Kind → payload mapping
// ---------------------------------------------------------------------------

const PAYLOAD_SCHEMAS: Record<EncounterKind, object> = {
  combat: COMBAT_PAYLOAD,
  puzzle: PUZZLE_PAYLOAD,
  social: SOCIAL_PAYLOAD,
  skill_challenge: SKILL_CHALLENGE_PAYLOAD,
  investigation: INVESTIGATION_PAYLOAD,
  trap: TRAP_PAYLOAD,
  exploration: EXPLORATION_PAYLOAD,
  chase: CHASE_PAYLOAD,
  hazard: HAZARD_PAYLOAD,
};

const ALL_KINDS: EncounterKind[] = [
  "combat",
  "puzzle",
  "social",
  "skill_challenge",
  "investigation",
  "trap",
  "exploration",
  "chase",
  "hazard",
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build a Gemini `responseJsonSchema` for encounter output.
 *
 * When `kind` is provided the schema is tightly scoped to that encounter
 * type's payload.  When omitted the payload is left as a generic object
 * (the system prompt still describes all payload shapes).
 */
export function getEncounterSchema(kind?: EncounterKind): object {
  const kindProp = kind
    ? { type: "string", enum: [kind] }
    : { type: "string", enum: ALL_KINDS };

  return {
    type: "object",
    properties: {
      kind: kindProp,
      title: STRING,
      goal: STRING,
      stakes: STAKES,
      spotlight: { type: "array", items: SPOTLIGHT_ITEM },
      setup: SETUP,
      payload: kind ? PAYLOAD_SCHEMAS[kind] : { type: "object" },
    },
    required: [
      "kind",
      "title",
      "goal",
      "stakes",
      "spotlight",
      "setup",
      "payload",
    ],
  };
}
