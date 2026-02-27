import {
  getCreature,
  getSpell,
  searchCreatures,
  searchSpells,
} from "@/lib/srd-lookup";
import { GoogleGenAI, Type, type Tool } from "@google/genai";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

// --- Shared Gemini Client ---

export const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export const MODEL = "gemini-2.5-flash";

// --- SRD Loading ---

const TOOL_BACKED_FILES = new Set(["Spells.md", "MonstersA-Z.md", "Animals.md"]);

function loadSrdContent(): string {
  const srdDir = join(process.cwd(), "srd");
  let content = "";

  function walkDir(dir: string) {
    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          walkDir(fullPath);
        } else if (entry.endsWith(".md") && !TOOL_BACKED_FILES.has(entry)) {
          const label = relative(srdDir, fullPath);
          const text = readFileSync(fullPath, "utf-8");
          content += `\n\n--- ${label} ---\n\n${text}`;
        }
      }
    } catch {
      console.warn(`Could not read directory: ${dir}`);
    }
  }

  walkDir(srdDir);
  return content;
}

export const srdContent = loadSrdContent();

// --- Tool Declarations ---

export const toolDeclarations: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "searchCreatures",
        description:
          "Search for monsters and animals by name, type, CR range, or keywords. Returns a summary list of up to 20 matching creatures.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: {
              type: Type.STRING,
              description:
                "Search keywords — matches against name, type, abilities, and full stat block text.",
            },
            cr_min: {
              type: Type.NUMBER,
              description:
                "Minimum Challenge Rating (use 0.125 for CR 1/8, 0.25 for CR 1/4, 0.5 for CR 1/2).",
            },
            cr_max: {
              type: Type.NUMBER,
              description: "Maximum Challenge Rating.",
            },
            type: {
              type: Type.STRING,
              description:
                "Creature type filter: Aberration, Beast, Celestial, Construct, Dragon, Elemental, Fey, Fiend, Giant, Humanoid, Monstrosity, Ooze, Plant, or Undead.",
            },
            size: {
              type: Type.STRING,
              description:
                "Size filter: Tiny, Small, Medium, Large, Huge, or Gargantuan.",
            },
          },
        },
      },
      {
        name: "getCreature",
        description:
          "Get the full stat block for a specific creature by exact name.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description:
                "Exact creature name, e.g. 'Aboleth', 'Young Red Dragon', 'Wolf'.",
            },
          },
          required: ["name"],
        },
      },
      {
        name: "searchSpells",
        description:
          "Search for spells by name, level, school, class, or keywords. Returns a summary list of up to 20 matching spells.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: {
              type: Type.STRING,
              description:
                "Search keywords — matches against name, school, and full spell text.",
            },
            level_min: {
              type: Type.NUMBER,
              description: "Minimum spell level (0 for cantrips).",
            },
            level_max: {
              type: Type.NUMBER,
              description: "Maximum spell level (9 max).",
            },
            school: {
              type: Type.STRING,
              description:
                "Spell school: Abjuration, Conjuration, Divination, Enchantment, Evocation, Illusion, Necromancy, or Transmutation.",
            },
            class_name: {
              type: Type.STRING,
              description:
                "Class filter: Bard, Cleric, Druid, Paladin, Ranger, Sorcerer, Warlock, or Wizard.",
            },
            concentration: {
              type: Type.BOOLEAN,
              description:
                "Filter by whether the spell requires concentration.",
            },
          },
        },
      },
      {
        name: "getSpell",
        description:
          "Get the full description of a specific spell by exact name.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description:
                "Exact spell name, e.g. 'Fireball', 'Healing Word', 'Shield'.",
            },
          },
          required: ["name"],
        },
      },
    ],
  },
];

// --- Tool Execution ---

export function executeTool(
  name: string,
  args: Record<string, unknown>
): Record<string, unknown> {
  switch (name) {
    case "searchCreatures":
      return { results: searchCreatures(args) };
    case "getCreature": {
      const text = getCreature(args.name as string);
      return text
        ? { statBlock: text }
        : { error: `Creature "${args.name}" not found in the SRD.` };
    }
    case "searchSpells":
      return { results: searchSpells(args) };
    case "getSpell": {
      const text = getSpell(args.name as string);
      return text
        ? { spell: text }
        : { error: `Spell "${args.name}" not found in the SRD.` };
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// --- Context Cache Management ---

let cachedContentName: string | null = null;
let cacheExpiresAt = 0;
let cacheDisabled = false;

const CACHE_TTL_SECONDS = 1800;

export async function getOrCreateCache(
  systemPrompt: string
): Promise<string> {
  if (cacheDisabled) return "";

  const now = Date.now();
  if (cachedContentName && now < cacheExpiresAt) {
    return cachedContentName;
  }

  try {
    const cache = await ai.caches.create({
      model: MODEL,
      config: {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "I'm a DM ready to design encounters. I have access to your creature and spell lookup tools.",
              },
            ],
          },
          {
            role: "model",
            parts: [
              {
                text: "I've loaded the D&D 5e SRD core rules and have tools to search for specific creature stat blocks and spells on demand. I'm ready to help you design encounters.",
              },
            ],
          },
        ],
        systemInstruction: systemPrompt,
        tools: toolDeclarations,
        ttl: `${CACHE_TTL_SECONDS}s`,
      },
    });

    cachedContentName = cache.name!;
    cacheExpiresAt = now + CACHE_TTL_SECONDS * 1000 - 60_000;
    console.log(`[Familiar] Created Gemini cache: ${cachedContentName}`);
    return cachedContentName;
  } catch (err) {
    console.warn(
      "[Familiar] Cache creation failed, falling back to uncached:",
      err
    );
    cachedContentName = null;
    cacheDisabled = true;
    return "";
  }
}

// --- Rate Limiting ---

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 300_000);

// --- Tool-call loop (non-streaming, returns final text) ---

export async function generateWithTools(
  systemPrompt: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contents: any[]
): Promise<string> {
  const cacheName = await getOrCreateCache(systemPrompt);

  const baseConfig: Record<string, unknown> = {
    maxOutputTokens: 16384,
  };

  if (cacheName) {
    baseConfig.cachedContent = cacheName;
  } else {
    baseConfig.systemInstruction = systemPrompt;
    baseConfig.tools = toolDeclarations;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentContents: any[] = [...contents];

  const MAX_TOOL_ROUNDS = 10;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    let response;
    try {
      response = await ai.models.generateContent({
        model: MODEL,
        contents: currentContents,
        config: baseConfig,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Familiar] Generate round ${round}: API call failed:`, msg);
      throw new Error(`Gemini API error: ${msg}`);
    }

    const candidate = response.candidates?.[0];
    const finishReason = candidate?.finishReason;
    const parts = candidate?.content?.parts;

    if (!parts || parts.length === 0) {
      const blockReason = response.promptFeedback?.blockReason;
      console.error(
        `[Familiar] Generate round ${round}: empty response.`,
        `finishReason=${finishReason}, blockReason=${blockReason},`,
        `candidates=${response.candidates?.length ?? 0}`
      );
      if (blockReason) {
        throw new Error(`Request blocked by Gemini safety filter: ${blockReason}`);
      }
      if (finishReason && finishReason !== "STOP") {
        throw new Error(`Generation stopped: ${finishReason}`);
      }
      throw new Error("Empty response from model — no content returned");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const functionCalls = parts.filter((p: any) => p.functionCall);

    if (functionCalls.length === 0) {
      // No tool calls — collect and return text
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const text = parts.map((p: any) => p.text || "").join("");
      if (!text) {
        console.error(
          `[Familiar] Generate round ${round}: parts present but no text content.`,
          `finishReason=${finishReason}, partCount=${parts.length}`
        );
        throw new Error("Model returned empty text");
      }
      return text;
    }

    console.log(
      `[Familiar] Generate round ${round}: executing ${functionCalls.length} tool call(s):`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      functionCalls.map((fc: any) =>
        `${fc.functionCall.name}(${JSON.stringify(fc.functionCall.args)})`
      )
    );

    currentContents.push({ role: "model" as const, parts: functionCalls });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responseParts = functionCalls.map((fc: any) => ({
      functionResponse: {
        name: fc.functionCall.name,
        response: executeTool(fc.functionCall.name, fc.functionCall.args),
      },
    }));

    currentContents.push({ role: "user" as const, parts: responseParts });
  }

  console.error(`[Familiar] Exhausted ${MAX_TOOL_ROUNDS} tool rounds without a text response`);
  throw new Error("Generation failed — too many tool call rounds without a final response");
}
