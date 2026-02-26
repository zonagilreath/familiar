"use client";

import type { Encounter, SpotlightEntry } from "@/types/encounter";

interface EncounterSheetProps {
  encounter: Encounter;
  onBack: () => void;
  onRegenerate: () => void;
}

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

const CLASS_ICONS: Record<string, string> = {
  fighter: "shield",
  wizard: "auto_awesome",
  sorcerer: "local_fire_department",
  rogue: "visibility",
  cleric: "church",
  paladin: "security",
  ranger: "nature",
  barbarian: "fitness_center",
  bard: "music_note",
  druid: "eco",
  monk: "self_improvement",
  warlock: "nights_stay",
};

const ROLE_ICONS: Record<string, string> = {
  martial: "shield",
  caster: "auto_awesome",
  healer: "healing",
  tank: "security",
  "skill monkey": "psychology",
  support: "group",
};

function getSpotlightIcon(entry: SpotlightEntry): string {
  if ("class_name" in entry) {
    return CLASS_ICONS[entry.class_name.toLowerCase()] || "person";
  }
  if ("role" in entry) {
    return ROLE_ICONS[entry.role.toLowerCase()] || "person";
  }
  return "person";
}

function getSpotlightLabel(entry: SpotlightEntry): string {
  if ("class_name" in entry) return entry.class_name;
  if ("role" in entry) return entry.role;
  return "";
}

function CombatPayload({ payload }: { payload: Encounter & { kind: "combat" } }) {
  const { forces, terrain, tactics, xp_budget, adjustments } = payload.payload;

  return (
    <>
      {/* Combat Roster */}
      <Section icon="groups" title="Combat Roster">
        <div className="bg-card-dark border border-white/10 rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="py-4 px-6 text-primary text-[10px] font-black uppercase tracking-widest">
                  Creature
                </th>
                <th className="py-4 px-6 text-primary text-[10px] font-black uppercase tracking-widest">
                  Role
                </th>
                <th className="py-4 px-6 text-primary text-[10px] font-black uppercase tracking-widest text-center">
                  Qty
                </th>
                <th className="py-4 px-6 text-primary text-[10px] font-black uppercase tracking-widest text-center">
                  CR
                </th>
                <th className="py-4 px-6 text-primary text-[10px] font-black uppercase tracking-widest">
                  Key Abilities
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {forces.map((f, i) => (
                <tr key={i} className="hover:bg-primary/5 transition-colors">
                  <td className="py-4 px-6 text-white font-bold">{f.name}</td>
                  <td className="py-4 px-6 text-slate-300 text-sm capitalize">
                    {f.role}
                  </td>
                  <td className="py-4 px-6 text-slate-300 text-center font-mono">
                    {f.count}
                  </td>
                  <td className="py-4 px-6 text-slate-300 text-center font-mono">
                    {f.cr}
                  </td>
                  <td className="py-4 px-6 text-slate-400 text-sm">
                    {f.key_abilities}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {xp_budget && (
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div className="px-3 py-1.5 bg-white/5 rounded border border-white/10 text-slate-300">
              <span className="text-primary font-bold">XP:</span>{" "}
              {xp_budget.total_xp.toLocaleString()} total /{" "}
              {xp_budget.adjusted_xp.toLocaleString()} adjusted
            </div>
            <div className="px-3 py-1.5 bg-white/5 rounded border border-white/10 text-slate-300">
              <span className="text-primary font-bold">Difficulty:</span>{" "}
              <span className="capitalize">{xp_budget.difficulty}</span> for{" "}
              {xp_budget.party_summary}
            </div>
          </div>
        )}
      </Section>

      {/* Terrain */}
      {terrain && terrain.length > 0 && (
        <Section icon="terrain" title="Terrain">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {terrain.map((t, i) => (
              <div
                key={i}
                className="p-3 rounded bg-white/5 border border-white/10"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-primary font-bold text-sm">
                    {t.name}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">
                    {t.type}
                  </span>
                </div>
                <p className="text-sm text-slate-300">{t.description}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Tactics */}
      {tactics && tactics.length > 0 && (
        <Section icon="strategy" title="Tactics">
          <ul className="space-y-2">
            {tactics.map((t, i) => (
              <li
                key={i}
                className="text-sm text-slate-300 pl-4 border-l-2 border-primary/30"
              >
                {t}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Adjustments */}
      {adjustments && adjustments.length > 0 && (
        <Section icon="tune" title="Adjustments">
          <ul className="space-y-2">
            {adjustments.map((a, i) => (
              <li
                key={i}
                className="text-sm text-slate-300 pl-4 border-l-2 border-accent-gold/30"
              >
                {a}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}

function PuzzlePayload({ payload }: { payload: Encounter & { kind: "puzzle" } }) {
  const { description, clues, solutions, dcs, fail_forward } = payload.payload;

  return (
    <>
      <Section icon="extension" title="The Puzzle">
        <p className="text-slate-300">{description}</p>
      </Section>

      <Section icon="lightbulb" title="Clues">
        <div className="space-y-2">
          {clues.map((c, i) => (
            <div
              key={i}
              className="p-3 rounded bg-white/5 border border-white/10"
            >
              <p className="text-sm text-white">{c.clue}</p>
              <div className="flex gap-4 mt-1 text-xs text-slate-400">
                <span>Discovery: {c.discovery_method}</span>
                <span>Supports: {c.supports}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section icon="route" title="Solutions">
        {solutions.map((s, i) => (
          <div key={i} className="mb-4 last:mb-0">
            <h4 className="text-sm font-bold text-white mb-1">{s.approach}</h4>
            <ol className="list-decimal list-inside text-sm text-slate-300 space-y-1">
              {s.steps.map((step, j) => (
                <li key={j}>{step}</li>
              ))}
            </ol>
          </div>
        ))}
      </Section>

      {dcs && dcs.length > 0 && (
        <Section icon="casino" title="DCs">
          <div className="space-y-1">
            {dcs.map((d, i) => (
              <div key={i} className="text-sm text-slate-300">
                <span className="text-primary font-bold">{d.skill} DC {d.dc}:</span>{" "}
                {d.result}
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section icon="forward" title="Fail Forward">
        <p className="text-sm text-slate-300">{fail_forward}</p>
      </Section>
    </>
  );
}

function SocialPayload({ payload }: { payload: Encounter & { kind: "social" } }) {
  const { npcs, discovery_phase, dcs, consequences } = payload.payload;

  return (
    <>
      {npcs.map((npc, i) => (
        <Section key={i} icon="person" title={npc.name}>
          <div className="space-y-2 text-sm text-slate-300">
            <p><span className="text-primary font-bold">Goal:</span> {npc.goal}</p>
            <p><span className="text-primary font-bold">Patience:</span> {npc.patience}</p>
            <p><span className="text-primary font-bold">Objections:</span> {npc.objections.join("; ")}</p>
            <p><span className="text-primary font-bold">Incentives:</span> {npc.incentives.join("; ")}</p>
            <div className="flex gap-4 mt-2 text-xs text-slate-400">
              <span>Ideals: {npc.traits.ideals}</span>
              <span>Bonds: {npc.traits.bonds}</span>
              <span>Flaws: {npc.traits.flaws}</span>
            </div>
          </div>
        </Section>
      ))}

      {discovery_phase && discovery_phase.length > 0 && (
        <Section icon="visibility" title="Discovery Phase">
          <ul className="space-y-1">
            {discovery_phase.map((d, i) => (
              <li key={i} className="text-sm text-slate-300 pl-4 border-l-2 border-primary/30">{d}</li>
            ))}
          </ul>
        </Section>
      )}

      <Section icon="casino" title="DCs by Attitude">
        <div className="flex gap-4 text-sm">
          <span className="text-emerald-400">Friendly: DC {dcs.friendly}</span>
          <span className="text-slate-300">Indifferent: DC {dcs.indifferent}</span>
          <span className="text-rose-400">Hostile: DC {dcs.hostile}</span>
        </div>
      </Section>

      <Section icon="fact_check" title="Consequences">
        <div className="space-y-2">
          {consequences.map((c, i) => (
            <div key={i} className="text-sm text-slate-300">
              <span className={`font-bold capitalize ${
                c.outcome === "success" ? "text-emerald-400" :
                c.outcome === "failure" ? "text-rose-400" : "text-accent-gold"
              }`}>{c.outcome}:</span>{" "}
              {c.description}
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

function SkillChallengePayload({ payload }: { payload: Encounter & { kind: "skill_challenge" } }) {
  const { successes_required, failures_allowed, skills, complications, partial_success } = payload.payload;

  return (
    <>
      <Section icon="flag" title="Threshold">
        <p className="text-lg text-white font-bold">
          {successes_required} successes before {failures_allowed} failures
        </p>
      </Section>

      <Section icon="list" title="Skills">
        <div className="space-y-2">
          {skills.map((s, i) => (
            <div key={i} className="text-sm text-slate-300">
              <span className="text-primary font-bold">{s.skill} DC {s.dc}:</span>{" "}
              {s.narrative}
            </div>
          ))}
        </div>
      </Section>

      {complications && complications.length > 0 && (
        <Section icon="warning" title="Complications">
          <div className="space-y-2">
            {complications.map((c, i) => (
              <div key={i} className="text-sm text-slate-300">
                <span className="text-accent-gold font-bold">{c.trigger}:</span>{" "}
                {c.description}
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section icon="horizontal_rule" title="Partial Success">
        <p className="text-sm text-slate-300">{partial_success}</p>
      </Section>
    </>
  );
}

function InvestigationPayload({ payload }: { payload: Encounter & { kind: "investigation" } }) {
  const { nodes, clues, red_herrings, connection_summary } = payload.payload;

  return (
    <>
      <Section icon="map" title="Nodes">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {nodes.map((n, i) => (
            <div key={i} className="p-3 rounded bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-primary font-bold text-sm">{n.name}</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">{n.type}</span>
              </div>
              <p className="text-sm text-slate-300">{n.description}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section icon="search" title="Clues">
        <div className="space-y-2">
          {clues.map((c, i) => (
            <div key={i} className="p-3 rounded bg-white/5 border border-white/10">
              <p className="text-sm text-white">{c.clue}</p>
              <div className="flex gap-4 mt-1 text-xs text-slate-400">
                <span>Node: {c.node}</span>
                <span>Points to: {c.points_to}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {red_herrings && red_herrings.length > 0 && (
        <Section icon="block" title="Red Herrings">
          <div className="space-y-2">
            {red_herrings.map((r, i) => (
              <div key={i} className="p-3 rounded bg-rose-500/5 border border-rose-500/20">
                <p className="text-sm text-white">{r.clue}</p>
                <p className="text-xs text-slate-400 mt-1">Plausibility: {r.plausibility}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section icon="hub" title="Connection Map">
        <p className="text-sm text-slate-300">{connection_summary}</p>
      </Section>
    </>
  );
}

function TrapPayload({ payload }: { payload: Encounter & { kind: "trap" } }) {
  const { setting, trigger, mechanism, consequence, countermeasures } = payload.payload;

  return (
    <>
      <Section icon="visibility" title="Setting (Telegraphing)">
        <ul className="space-y-1">
          {setting.map((s, i) => (
            <li key={i} className="text-sm text-slate-300 pl-4 border-l-2 border-accent-gold/30">{s}</li>
          ))}
        </ul>
      </Section>

      <Section icon="touch_app" title="Trigger">
        <p className="text-sm text-slate-300">{trigger}</p>
      </Section>

      <Section icon="settings" title="Mechanism">
        <p className="text-sm text-slate-300">{mechanism}</p>
      </Section>

      <Section icon="dangerous" title="Consequence">
        <p className="text-sm text-slate-300">{consequence}</p>
      </Section>

      <Section icon="handyman" title="Countermeasures">
        <div className="space-y-2">
          {countermeasures.map((c, i) => (
            <div key={i} className="text-sm text-slate-300">
              <span className="text-emerald-400 font-bold">{c.method}:</span>{" "}
              {c.details}
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

function ExplorationPayload({ payload }: { payload: Encounter & { kind: "exploration" } }) {
  const { beacons, journey, paths } = payload.payload;

  return (
    <>
      <Section icon="location_on" title="Visual Beacons">
        <div className="space-y-3">
          {beacons.map((b, i) => (
            <div key={i} className="p-3 rounded bg-white/5 border border-white/10">
              <p className="text-sm text-white">{b.description}</p>
              <p className="text-xs text-slate-400 mt-1">Discovery: {b.discovery}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section icon="hiking" title="Journey">
        <ul className="space-y-1">
          {journey.map((j, i) => (
            <li key={i} className="text-sm text-slate-300 pl-4 border-l-2 border-primary/30">{j}</li>
          ))}
        </ul>
      </Section>

      <Section icon="fork_right" title="Paths">
        <div className="space-y-3">
          {paths.map((p, i) => (
            <div key={i} className="p-3 rounded bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-primary font-bold text-sm">{p.name}</span>
                <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  p.risk === "low" ? "text-emerald-400 bg-emerald-500/10" :
                  p.risk === "high" ? "text-rose-400 bg-rose-500/10" : "text-accent-gold bg-accent-gold/10"
                }`}>{p.risk} risk</span>
              </div>
              <p className="text-sm text-slate-300">{p.description}</p>
              <p className="text-xs text-slate-400 mt-1">Reward: {p.reward}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

function ChasePayload({ payload }: { payload: Encounter & { kind: "chase" } }) {
  const { duration, complications, distance_tracking, win_condition, loss_condition } = payload.payload;

  return (
    <>
      <Section icon="timer" title="Duration">
        <p className="text-lg text-white font-bold">{duration} rounds</p>
      </Section>

      <Section icon="casino" title="Complications">
        <div className="bg-card-dark border border-white/10 rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="py-3 px-4 text-primary text-[10px] font-black uppercase tracking-widest">Roll</th>
                <th className="py-3 px-4 text-primary text-[10px] font-black uppercase tracking-widest">Obstacle</th>
                <th className="py-3 px-4 text-primary text-[10px] font-black uppercase tracking-widest">Skill</th>
                <th className="py-3 px-4 text-primary text-[10px] font-black uppercase tracking-widest text-center">DC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {complications.map((c, i) => (
                <tr key={i} className="hover:bg-primary/5 transition-colors">
                  <td className="py-3 px-4 text-white font-mono">{c.roll}</td>
                  <td className="py-3 px-4 text-slate-300 text-sm">{c.obstacle}</td>
                  <td className="py-3 px-4 text-slate-300 text-sm">{c.skill}</td>
                  <td className="py-3 px-4 text-slate-300 text-center font-mono">{c.dc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section icon="straighten" title="Distance Tracking">
        <p className="text-sm text-slate-300">{distance_tracking}</p>
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-500/5 border-l-4 border-emerald-500 p-4 rounded-r">
          <h3 className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">Win</h3>
          <p className="text-sm text-slate-300">{win_condition}</p>
        </div>
        <div className="bg-rose-500/5 border-l-4 border-rose-500 p-4 rounded-r">
          <h3 className="text-rose-400 text-xs font-bold uppercase tracking-widest mb-1">Loss</h3>
          <p className="text-sm text-slate-300">{loss_condition}</p>
        </div>
      </div>
    </>
  );
}

function HazardPayload({ payload }: { payload: Encounter & { kind: "hazard" } }) {
  const { skills_required, resource_cost, choice_points, conversion } = payload.payload;

  return (
    <>
      <Section icon="list" title="Skills Required">
        <div className="space-y-2">
          {skills_required.map((s, i) => (
            <div key={i} className="text-sm text-slate-300">
              <span className="text-primary font-bold">{s.skill} DC {s.dc}:</span>{" "}
              {s.narrative}
            </div>
          ))}
        </div>
      </Section>

      <Section icon="remove_circle" title="Resource Cost">
        <p className="text-sm text-slate-300">{resource_cost}</p>
      </Section>

      <Section icon="fork_right" title="Choice Points">
        <div className="space-y-2">
          {choice_points.map((c, i) => (
            <div key={i} className="p-3 rounded bg-white/5 border border-white/10">
              <p className="text-sm text-white">{c.choice}</p>
              <p className="text-xs text-slate-400 mt-1">Trade-off: {c.trade_off}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section icon="swap_horiz" title="On Failure">
        <p className="text-sm text-slate-300">{conversion}</p>
      </Section>
    </>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4 px-2">
        <span className="material-symbols-outlined text-primary">{icon}</span>
        <h2 className="text-white font-bold text-lg uppercase tracking-wider">
          {title}
        </h2>
      </div>
      <div>{children}</div>
    </section>
  );
}

function TypePayload({ encounter }: { encounter: Encounter }) {
  switch (encounter.kind) {
    case "combat":
      return <CombatPayload payload={encounter} />;
    case "puzzle":
      return <PuzzlePayload payload={encounter} />;
    case "social":
      return <SocialPayload payload={encounter} />;
    case "skill_challenge":
      return <SkillChallengePayload payload={encounter} />;
    case "investigation":
      return <InvestigationPayload payload={encounter} />;
    case "trap":
      return <TrapPayload payload={encounter} />;
    case "exploration":
      return <ExplorationPayload payload={encounter} />;
    case "chase":
      return <ChasePayload payload={encounter} />;
    case "hazard":
      return <HazardPayload payload={encounter} />;
  }
}

export default function EncounterSheet({
  encounter,
  onBack,
  onRegenerate,
}: EncounterSheetProps) {
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-primary/20 px-6 py-4 bg-bg-dark/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-3xl">
            auto_fix_high
          </span>
          <h1 className="text-white text-xl font-black tracking-tight uppercase">
            Encounter Run Sheet
          </h1>
        </div>
        <div className="px-3 py-1 bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider rounded border border-primary/30">
          {KIND_LABELS[encounter.kind] || encounter.kind}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        {/* Execution Summary */}
        <section className="bg-card-dark border border-primary/30 rounded-xl overflow-hidden shadow-2xl mb-8">
          <div className="p-5 border-b border-primary/20 bg-primary/5 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              description
            </span>
            <h2 className="text-white font-bold text-lg">Execution Summary</h2>
          </div>
          <div className="p-6 space-y-8">
            {/* Goal */}
            <div>
              <h3 className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-2">
                The Goal
              </h3>
              <p className="text-xl text-white font-medium leading-relaxed italic">
                &ldquo;{encounter.goal}&rdquo;
              </p>
            </div>

            {/* Stakes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-emerald-500/5 border-l-4 border-emerald-500 p-4 rounded-r">
                <h3 className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">
                  Success
                </h3>
                <p className="text-slate-300 text-sm">
                  {encounter.stakes.on_success}
                </p>
              </div>
              <div className="bg-rose-500/5 border-l-4 border-rose-500 p-4 rounded-r">
                <h3 className="text-rose-400 text-xs font-bold uppercase tracking-widest mb-1">
                  Fail-Forward
                </h3>
                <p className="text-slate-300 text-sm">
                  {encounter.stakes.on_failure}
                </p>
              </div>
            </div>

            {/* Spotlight */}
            {encounter.spotlight && encounter.spotlight.length > 0 && (
              <div>
                <h3 className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-4">
                  PC Spotlight Hooks
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {encounter.spotlight.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-4 p-3 rounded bg-white/5 border border-white/10"
                    >
                      <span className="material-symbols-outlined text-primary mt-0.5">
                        {getSpotlightIcon(s)}
                      </span>
                      <p className="text-slate-300 text-sm">
                        <strong className="text-white">
                          {getSpotlightLabel(s)}:
                        </strong>{" "}
                        {s.hook}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Setup */}
            {encounter.setup && (
              <div>
                <h3 className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-2">
                  Setup
                </h3>
                <div className="text-sm text-slate-300 space-y-1">
                  {encounter.setup.location_tags?.length > 0 && (
                    <p>
                      <span className="text-primary font-bold">Location:</span>{" "}
                      {encounter.setup.location_tags.join(", ")}
                    </p>
                  )}
                  {encounter.setup.time_pressure && (
                    <p>
                      <span className="text-primary font-bold">
                        Time Pressure:
                      </span>{" "}
                      {encounter.setup.time_pressure}
                    </p>
                  )}
                  {encounter.setup.opening && (
                    <p>
                      <span className="text-primary font-bold">Opening:</span>{" "}
                      {encounter.setup.opening}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Type-specific payload */}
        <TypePayload encounter={encounter} />
      </main>

      {/* Footer */}
      <footer className="shrink-0 bg-bg-dark border-t border-primary/30 p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-3 text-slate-400 hover:text-white transition-colors font-bold text-sm uppercase tracking-wider"
          >
            <span className="material-symbols-outlined text-xl">
              arrow_back
            </span>
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="flex items-center gap-3 flex-1 justify-center sm:justify-end">
            <button
              onClick={onRegenerate}
              className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-light text-white font-black rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-95 uppercase tracking-widest text-sm"
            >
              <span className="material-symbols-outlined text-xl">
                refresh
              </span>
              <span>Regenerate</span>
            </button>
            <div className="h-8 w-px bg-white/10 mx-1" />
            <button
              onClick={() => {
                const blob = new Blob(
                  [JSON.stringify(encounter, null, 2)],
                  { type: "application/json" }
                );
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${encounter.title?.replace(/\s+/g, "_") || "encounter"}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg border border-white/10 transition-all uppercase tracking-wider text-sm"
            >
              <span className="material-symbols-outlined text-xl">
                download
              </span>
              <span className="hidden md:inline">Export</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
