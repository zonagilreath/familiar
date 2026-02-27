import type { Encounter, EncounterKind } from "@/types/encounter";

const combat: Encounter = {
  kind: "combat",
  title: "Goblin Ambush at Thornbridge",
  goal: "Survive the goblin ambush and secure the bridge crossing",
  stakes: {
    on_success:
      "The party crosses safely and gains information about the goblin camp upstream",
    on_failure:
      "The party is driven back and the goblins reinforce, making the crossing harder next time",
  },
  spotlight: [
    {
      class_name: "Fighter",
      hook: "Chokepoint at the bridge narrows — shield wall holds the line while ranged picks off archers.",
    },
    {
      class_name: "Rogue",
      hook: "Overgrown brambles on the east bank offer concealment for a flanking approach to the boss.",
    },
  ],
  setup: {
    location_tags: ["forest", "bridge", "river"],
    time_pressure:
      "Goblin reinforcements arrive in 4 rounds from the upstream camp",
    opening:
      "PCs hear twigs snapping and see crude arrow slits in the tree line 60ft ahead. Initiative.",
  },
  payload: {
    forces: [
      {
        name: "Goblin Boss",
        role: "leader",
        count: 1,
        cr: 1,
        key_abilities: "Redirect Attack, Multiattack",
      },
      {
        name: "Goblin",
        role: "minion",
        count: 6,
        cr: 0.25,
        key_abilities: "Nimble Escape, Shortbow",
      },
      {
        name: "Worg",
        role: "skirmisher",
        count: 2,
        cr: 0.5,
        key_abilities: "Keen Senses, Pack Tactics",
      },
    ],
    terrain: [
      {
        name: "Thornbridge",
        type: "obstacle",
        description:
          "15ft wooden bridge, single file. Creatures can be shoved off (DC 12 Athletics) into the river below.",
      },
      {
        name: "Bramble Thicket",
        type: "cover",
        description:
          "Heavy undergrowth on the east bank. Half cover, difficult terrain. Hides 2 goblins.",
      },
    ],
    tactics: [
      "Goblin Boss stays behind the bridge, using Redirect Attack to sacrifice minions",
      "Worgs circle to flank anyone crossing the bridge",
      "Goblins use Nimble Escape to duck into brambles after shooting",
    ],
    xp_budget: {
      total_xp: 450,
      adjusted_xp: 675,
      difficulty: "medium",
      party_summary: "4 level-3 PCs",
    },
    adjustments: [
      "Easier: Remove 1 Worg and 2 Goblins",
      "Harder: Add a Goblin Shaman (CR 1) with Entangle",
    ],
  },
};

const puzzle: Encounter = {
  kind: "puzzle",
  title: "The Alchemist's Lock",
  goal: "Open the sealed vault door by solving the alchemical reagent puzzle",
  stakes: {
    on_success:
      "The vault opens revealing the McGuffin and a cache of potions",
    on_failure:
      "Wrong combinations release poison gas — 2d6 poison damage, DC 13 Con save for half",
  },
  spotlight: [
    {
      role: "caster",
      hook: "Arcana check reveals the sigils correspond to elemental schools.",
    },
    {
      role: "skill monkey",
      hook: "Investigation on the workbench finds the alchemist's partial notes.",
    },
  ],
  setup: {
    location_tags: ["underground", "laboratory", "dim light"],
    time_pressure:
      "Liquid in the ceiling vials slowly drips — 10 rounds before gas fills the room regardless",
    opening:
      "Stone door with three recessed basins. Workbench covered in vials, a smashed journal, and scorch marks.",
  },
  payload: {
    description:
      "Three recessed basins on the vault door must be filled with the correct alchemical reagents in the correct order. The workbench has 6 labeled vials (2 are decoys). The correct combination triggers a color sequence: red, blue, green.",
    clues: [
      {
        clue: "The journal page reads: 'Fire first, then the depths, then growth.'",
        discovery_method: "Free — visible on the workbench",
        supports: "Correct order",
      },
      {
        clue: "Scorch marks around the first basin suggest a fire-related substance",
        discovery_method: "Investigation DC 12",
        supports: "First reagent",
      },
      {
        clue: "Faint waterline inside the second basin",
        discovery_method: "Perception DC 14",
        supports: "Second reagent",
      },
    ],
    solutions: [
      {
        approach: "Follow the clues",
        steps: [
          "Read the journal fragment",
          "Match 'fire' to the red vial",
          "Match 'depths' to the blue vial",
          "Match 'growth' to the green vial",
          "Pour in order",
        ],
      },
      {
        approach: "Brute force with caution",
        steps: [
          "Test vials one at a time with Mage Hand",
          "Note color reactions",
          "Deduce correct combination from results",
        ],
      },
    ],
    dcs: [
      {
        skill: "Arcana",
        dc: 14,
        result: "Identifies the reagents by school of magic",
      },
      {
        skill: "Investigation",
        dc: 12,
        result: "Finds the partial journal notes",
      },
      {
        skill: "Perception",
        dc: 14,
        result: "Notices the waterline and scorch patterns",
      },
    ],
    fail_forward:
      "Wrong combination releases gas but also cracks the door slightly — can be forced open with DC 20 Athletics, or the party can try again with one fewer vial option.",
  },
};

const social: Encounter = {
  kind: "social",
  title: "The Merchant's Dilemma",
  goal: "Convince the guild master to share intelligence about the smuggling ring",
  stakes: {
    on_success:
      "The guild master provides a map of the smuggling tunnels and a contact name",
    on_failure:
      "The guild master tips off the smugglers — they move their operation and the trail goes cold for 1d4 days",
  },
  spotlight: [
    {
      role: "support",
      hook: "Guild master's bodyguard is ex-military — shared background could build rapport.",
    },
    {
      role: "caster",
      hook: "Detect Thoughts or Zone of Truth could shortcut negotiation but risks offense.",
    },
  ],
  setup: {
    location_tags: ["urban", "guildhall", "busy"],
    time_pressure:
      "Smugglers move their cargo at midnight tonight — PCs have until then",
    opening:
      "Guild master Aldric Voss sits behind a mahogany desk, two guards flanking. He's expecting a trade delegation, not adventurers.",
  },
  payload: {
    npcs: [
      {
        name: "Aldric Voss",
        goal: "Protect his reputation and business interests above all else",
        objections: [
          "Doesn't want to be seen cooperating with outsiders",
          "Fears retaliation from the smuggling ring",
        ],
        incentives: [
          "The smugglers are undercutting his legitimate trade",
          "Owes a favor to the local temple",
        ],
        patience:
          "Will hear them out for 3 exchanges before dismissing them. Drops to 1 if threatened.",
        traits: {
          ideals: "Order and fair commerce",
          bonds: "His daughter runs the eastern branch",
          flaws: "Paranoid about losing status",
        },
      },
    ],
    discovery_phase: [
      "Insight DC 13: Voss is more afraid than angry — he's already been threatened by the smugglers",
      "Perception DC 15: Bruises on his wrists suggest recent rough handling",
    ],
    dcs: { friendly: 10, indifferent: 15, hostile: 20 },
    consequences: [
      {
        outcome: "success",
        description:
          "Voss provides the tunnel map and names his contact in the docks district",
      },
      {
        outcome: "partial",
        description:
          "Voss gives vague directions but won't name names — the party gets a lead but not the full picture",
      },
      {
        outcome: "failure",
        description:
          "Voss refuses and sends word to the smugglers. They relocate operations within hours.",
      },
    ],
  },
};

const trap: Encounter = {
  kind: "trap",
  title: "The Pressure Plate Gallery",
  goal: "Navigate through the trapped corridor to reach the inner sanctum",
  stakes: {
    on_success:
      "The party crosses safely and the trap mechanism can be salvaged for parts",
    on_failure:
      "Dart volley hits for 4d6 piercing, and the noise alerts guards in the next room",
  },
  spotlight: [
    {
      class_name: "Rogue",
      hook: "Thieves' Tools can disable individual pressure plates — DC 15 per plate.",
    },
    {
      class_name: "Ranger",
      hook: "Primeval Awareness or high Perception spots the slight color difference in trapped tiles.",
    },
  ],
  setup: {
    location_tags: ["dungeon", "corridor", "dim light"],
    time_pressure: null,
    opening:
      "30ft stone corridor, 10ft wide. Floor tiles alternate between grey and slightly off-white. Tiny holes line both walls at waist height.",
  },
  payload: {
    setting: [
      "Off-white tiles are fractionally higher than the grey ones",
      "Tiny holes (dart tubes) line both walls at waist height, spaced every 5ft",
      "A faint clicking sound comes from beneath the floor when weight shifts",
    ],
    trigger: "More than 20 lbs of pressure on any off-white tile",
    mechanism:
      "Spring-loaded pressure plate connects to a pneumatic dart launcher. Each plate fires 4 darts from the nearest wall holes targeting the 5ft square.",
    consequence:
      "4d6 piercing damage (Dex save DC 14 for half). The sound alerts creatures within 100ft.",
    countermeasures: [
      {
        method: "Thieves' Tools (DC 15)",
        details:
          "Disable individual plates by jamming the spring mechanism. Takes 1 minute per plate.",
      },
      {
        method: "Avoid (Acrobatics DC 12)",
        details:
          "Step only on grey tiles. Failure triggers the nearest plate.",
      },
      {
        method: "Mage Hand / Object",
        details:
          "Trigger plates remotely from outside the dart range (10ft from wall).",
      },
    ],
  },
};

export const DEMO_ENCOUNTERS: Record<string, Encounter> = {
  combat,
  puzzle,
  social,
  trap,
};

export const DEMO_KINDS: EncounterKind[] = ["combat", "puzzle", "social", "trap"];
