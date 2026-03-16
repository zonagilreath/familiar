import type { Encounter } from "@/types/encounter";

const KIND_LABELS: Record<string, string> = {
  combat: "Combat Encounter",
  puzzle: "Puzzle Encounter",
  social: "Social Encounter",
  skill_challenge: "Skill Challenge",
  investigation: "Investigation",
  trap: "Trap Encounter",
  exploration: "Exploration",
  chase: "Chase Encounter",
  hazard: "Environmental Hazard",
};

function combatSection(enc: Encounter & { kind: "combat" }): string {
  const { forces, terrain, tactics, xp_budget, adjustments } = enc.payload;
  const lines: string[] = [];

  lines.push("## Combat Roster\n");
  lines.push("| Creature | Role | Qty | CR | Key Abilities |");
  lines.push("|----------|------|:---:|:--:|---------------|");
  for (const f of forces) {
    lines.push(`| ${f.name} | ${f.role} | ${f.count} | ${f.cr} | ${f.key_abilities} |`);
  }

  if (xp_budget) {
    lines.push("\n## Difficulty Assessment\n");
    lines.push(`- **XP:** ${xp_budget.total_xp.toLocaleString()} total / ${xp_budget.adjusted_xp.toLocaleString()} adjusted`);
    lines.push(`- **Difficulty:** ${xp_budget.difficulty} for ${xp_budget.party_summary}`);
  }

  if (terrain?.length) {
    lines.push("\n## Terrain\n");
    for (const t of terrain) {
      lines.push(`- **${t.name}** _(${t.type})_ — ${t.description}`);
    }
  }

  if (tactics?.length) {
    lines.push("\n## Tactics\n");
    for (const t of tactics) lines.push(`- ${t}`);
  }

  if (adjustments?.length) {
    lines.push("\n## Adjustments\n");
    for (const a of adjustments) lines.push(`- ${a}`);
  }

  return lines.join("\n");
}

function puzzleSection(enc: Encounter & { kind: "puzzle" }): string {
  const { description, clues, solutions, dcs, fail_forward } = enc.payload;
  const lines: string[] = [];

  lines.push("## The Puzzle\n");
  lines.push(description);

  lines.push("\n## Clues\n");
  for (const c of clues) {
    lines.push(`- ${c.clue} _(${c.discovery_method}, supports: ${c.supports})_`);
  }

  lines.push("\n## Solutions\n");
  for (const s of solutions) {
    lines.push(`### ${s.approach}\n`);
    s.steps.forEach((step, i) => lines.push(`${i + 1}. ${step}`));
    lines.push("");
  }

  if (dcs?.length) {
    lines.push("## DCs\n");
    for (const d of dcs) lines.push(`- **${d.skill} DC ${d.dc}:** ${d.result}`);
  }

  lines.push("\n## Fail Forward\n");
  lines.push(fail_forward);

  return lines.join("\n");
}

function socialSection(enc: Encounter & { kind: "social" }): string {
  const { npcs, discovery_phase, dcs, consequences } = enc.payload;
  const lines: string[] = [];

  for (const npc of npcs) {
    lines.push(`## ${npc.name}\n`);
    lines.push(`- **Goal:** ${npc.goal}`);
    lines.push(`- **Patience:** ${npc.patience}`);
    lines.push(`- **Objections:** ${npc.objections.join("; ")}`);
    lines.push(`- **Incentives:** ${npc.incentives.join("; ")}`);
    lines.push(`- _Ideals:_ ${npc.traits.ideals} | _Bonds:_ ${npc.traits.bonds} | _Flaws:_ ${npc.traits.flaws}`);
    lines.push("");
  }

  if (discovery_phase?.length) {
    lines.push("## Discovery Phase\n");
    for (const d of discovery_phase) lines.push(`- ${d}`);
  }

  lines.push("\n## DCs by Attitude\n");
  lines.push(`- Friendly: DC ${dcs.friendly}`);
  lines.push(`- Indifferent: DC ${dcs.indifferent}`);
  lines.push(`- Hostile: DC ${dcs.hostile}`);

  lines.push("\n## Consequences\n");
  for (const c of consequences) lines.push(`- **${c.outcome}:** ${c.description}`);

  return lines.join("\n");
}

function skillChallengeSection(enc: Encounter & { kind: "skill_challenge" }): string {
  const { successes_required, failures_allowed, skills, complications, partial_success } = enc.payload;
  const lines: string[] = [];

  lines.push(`## Threshold\n`);
  lines.push(`**${successes_required} successes** before **${failures_allowed} failures**`);

  lines.push("\n## Skills\n");
  for (const s of skills) lines.push(`- **${s.skill} DC ${s.dc}:** ${s.narrative}`);

  if (complications?.length) {
    lines.push("\n## Complications\n");
    for (const c of complications) lines.push(`- **${c.trigger}:** ${c.description}`);
  }

  lines.push("\n## Partial Success\n");
  lines.push(partial_success);

  return lines.join("\n");
}

function investigationSection(enc: Encounter & { kind: "investigation" }): string {
  const { nodes, clues, red_herrings, connection_summary } = enc.payload;
  const lines: string[] = [];

  lines.push("## Nodes\n");
  for (const n of nodes) lines.push(`- **${n.name}** _(${n.type})_ — ${n.description}`);

  lines.push("\n## Clues\n");
  for (const c of clues) lines.push(`- ${c.clue} _(Node: ${c.node}, points to: ${c.points_to})_`);

  if (red_herrings?.length) {
    lines.push("\n## Red Herrings\n");
    for (const r of red_herrings) lines.push(`- ${r.clue} _(${r.plausibility})_`);
  }

  lines.push("\n## Connection Map\n");
  lines.push(connection_summary);

  return lines.join("\n");
}

function trapSection(enc: Encounter & { kind: "trap" }): string {
  const { setting, trigger, mechanism, consequence, countermeasures } = enc.payload;
  const lines: string[] = [];

  lines.push("## Setting (Telegraphing)\n");
  for (const s of setting) lines.push(`- ${s}`);

  lines.push("\n## Trigger\n");
  lines.push(trigger);

  lines.push("\n## Mechanism\n");
  lines.push(mechanism);

  lines.push("\n## Consequence\n");
  lines.push(consequence);

  lines.push("\n## Countermeasures\n");
  for (const c of countermeasures) lines.push(`- **${c.method}:** ${c.details}`);

  return lines.join("\n");
}

function explorationSection(enc: Encounter & { kind: "exploration" }): string {
  const { beacons, journey, paths } = enc.payload;
  const lines: string[] = [];

  lines.push("## Visual Beacons\n");
  for (const b of beacons) lines.push(`- ${b.description} — _Discovery: ${b.discovery}_`);

  lines.push("\n## Journey\n");
  for (const j of journey) lines.push(`- ${j}`);

  lines.push("\n## Paths\n");
  for (const p of paths) {
    lines.push(`### ${p.name} _(${p.risk} risk)_\n`);
    lines.push(p.description);
    lines.push(`\n_Reward: ${p.reward}_\n`);
  }

  return lines.join("\n");
}

function chaseSection(enc: Encounter & { kind: "chase" }): string {
  const { duration, complications, distance_tracking, win_condition, loss_condition } = enc.payload;
  const lines: string[] = [];

  lines.push(`## Duration\n\n${duration} rounds`);

  lines.push("\n## Complications\n");
  lines.push("| Roll | Obstacle | Skill | DC |");
  lines.push("|:----:|----------|-------|----|");
  for (const c of complications) {
    lines.push(`| ${c.roll} | ${c.obstacle} | ${c.skill} | ${c.dc} |`);
  }

  lines.push("\n## Distance Tracking\n");
  lines.push(distance_tracking);

  lines.push("\n## Win Condition\n");
  lines.push(win_condition);

  lines.push("\n## Loss Condition\n");
  lines.push(loss_condition);

  return lines.join("\n");
}

function hazardSection(enc: Encounter & { kind: "hazard" }): string {
  const { skills_required, resource_cost, choice_points, conversion } = enc.payload;
  const lines: string[] = [];

  lines.push("## Skills Required\n");
  for (const s of skills_required) lines.push(`- **${s.skill} DC ${s.dc}:** ${s.narrative}`);

  lines.push("\n## Resource Cost\n");
  lines.push(resource_cost);

  lines.push("\n## Choice Points\n");
  for (const c of choice_points) lines.push(`- **${c.choice}** — _Trade-off: ${c.trade_off}_`);

  lines.push("\n## On Failure\n");
  lines.push(conversion);

  return lines.join("\n");
}

function payloadSection(enc: Encounter): string {
  switch (enc.kind) {
    case "combat": return combatSection(enc);
    case "puzzle": return puzzleSection(enc);
    case "social": return socialSection(enc);
    case "skill_challenge": return skillChallengeSection(enc);
    case "investigation": return investigationSection(enc);
    case "trap": return trapSection(enc);
    case "exploration": return explorationSection(enc);
    case "chase": return chaseSection(enc);
    case "hazard": return hazardSection(enc);
  }
}

export function encounterToMarkdown(enc: Encounter): string {
  const lines: string[] = [];

  lines.push(`# ${enc.title}`);
  lines.push(`_${KIND_LABELS[enc.kind] || enc.kind}_\n`);

  lines.push(`> **Goal:** ${enc.goal}\n`);

  lines.push("## Stakes\n");
  lines.push(`- **Success:** ${enc.stakes.on_success}`);
  lines.push(`- **Failure:** ${enc.stakes.on_failure}`);

  if (enc.setup) {
    lines.push("\n## Setup\n");
    if (enc.setup.location_tags?.length) {
      lines.push(`- **Location:** ${enc.setup.location_tags.join(", ")}`);
    }
    if (enc.setup.time_pressure) {
      lines.push(`- **Time Pressure:** ${enc.setup.time_pressure}`);
    }
    if (enc.setup.opening) {
      lines.push(`- **Opening:** ${enc.setup.opening}`);
    }
  }

  lines.push("\n" + payloadSection(enc));

  if (enc.spotlight?.length) {
    lines.push("\n## PC Spotlight Hooks\n");
    for (const s of enc.spotlight) {
      const label = "class_name" in s ? s.class_name : "role" in s ? s.role : "";
      lines.push(`- **${label}:** ${s.hook}`);
    }
  }

  lines.push("\n---\n_Generated by Familiar_");

  return lines.join("\n");
}
