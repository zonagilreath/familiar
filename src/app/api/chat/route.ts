import { GoogleGenAI, Type, type Tool } from "@google/genai";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import {
  searchCreatures,
  getCreature,
  searchSpells,
  getSpell,
} from "@/lib/srd-lookup";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL = "gemini-2.5-flash";

// Files that are now behind tool calls — exclude from cached context
const TOOL_BACKED_FILES = new Set([
  "07_Spells.md",
  "12_MonstersA-Z.md",
  "13_Animals.md",
]);

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

const srdContent = loadSrdContent();

const SYSTEM_PROMPT = `You are Familiar, an expert D&D 5e assistant for dungeon masters. Your specialty is designing creative, balanced, and memorable encounters.

You have core D&D 5e rules loaded in your context (combat, classes, equipment, conditions, encounter building, etc.).

For specific creatures and spells, you have tools to search and retrieve them on demand:
- Use searchCreatures to find monsters/animals by theme, type, CR range, or keywords
- Use getCreature to pull the full stat block for a specific creature
- Use searchSpells to find spells by level, school, class, or keywords
- Use getSpell to pull the full description of a specific spell

When designing encounters:
1. Search for creatures that fit the theme and party level
2. Pull full stat blocks for the ones you want to use
3. Use the encounter building rules (XP budgets) from your context to balance the encounter
4. Provide tactical notes for how the monsters would fight

<srd_reference>
${srdContent}
</srd_reference>

When helping a DM, you should:
- Ask clarifying questions about party composition (level, size, classes) if not provided
- Suggest encounters that match the requested difficulty and theme
- Include specific monster stat references when relevant
- Consider terrain, lighting, environmental hazards, and conditions
- Provide tactical notes for how monsters would behave in combat
- Suggest narrative hooks and dramatic moments within encounters
- Note the adjusted XP and difficulty rating for encounters you design

Be creative but grounded in the rules. Format your responses clearly with headers and bullet points where appropriate. If the DM asks about rules, refer to the SRD content. If they want encounter ideas, go beyond the basics — give them something their players will remember.`;

// --- Gemini Tool Declarations ---

const toolDeclarations: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "searchCreatures",
        description:
          "Search for monsters and animals by name, type, CR range, or keywords. Returns a summary list of up to 20 matching creatures. Use this to discover creatures that fit an encounter theme before pulling full stat blocks.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: {
              type: Type.STRING,
              description:
                "Search keywords — matches against name, type, abilities, and full stat block text. Examples: 'undead', 'fire breath', 'swamp', 'spider'.",
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
          "Get the full stat block for a specific creature by exact name. Use after searching to get complete stats (AC, HP, abilities, actions, traits) for encounter building.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description:
                "Exact creature name, e.g. 'Aboleth', 'Young Red Dragon', 'Wolf', 'Goblin'.",
            },
          },
          required: ["name"],
        },
      },
      {
        name: "searchSpells",
        description:
          "Search for spells by name, level, school, class, or keywords. Returns a summary list of up to 20 matching spells. Useful for finding spells relevant to an encounter or NPC spellcaster.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: {
              type: Type.STRING,
              description:
                "Search keywords — matches against name, school, and full spell text. Examples: 'fire damage', 'healing', 'teleport', 'area'.",
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
              description: "Filter by whether the spell requires concentration.",
            },
          },
        },
      },
      {
        name: "getSpell",
        description:
          "Get the full description of a specific spell by exact name. Use to get complete mechanics (casting time, range, duration, effects) for reference.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description:
                "Exact spell name, e.g. 'Fireball', 'Healing Word', 'Shield', 'Counterspell'.",
            },
          },
          required: ["name"],
        },
      },
    ],
  },
];

// --- Tool Execution ---

function executeTool(
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
let cacheDisabled = false; // Skip retries after first failure (e.g. free tier)

const CACHE_TTL_SECONDS = 1800; // 30 minutes

async function getOrCreateCache(): Promise<string> {
  if (cacheDisabled) return "";

  const now = Date.now();
  if (cachedContentName && now < cacheExpiresAt) {
    return cachedContentName;
  }

  try {
    // Include system prompt AND tools in the cache so they don't need to be
    // sent with each generate request (Gemini forbids setting tools alongside
    // cachedContent in the generate call).
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
        systemInstruction: SYSTEM_PROMPT,
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
    cacheDisabled = true; // Don't retry — avoids wasting token quota
    return "";
  }
}

// --- Types ---

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// --- Route Handler ---

export async function POST(request: Request) {
  try {
    const { messages } = (await request.json()) as {
      messages: ChatMessage[];
    };

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: "messages array is required" },
        { status: 400 }
      );
    }

    // Map frontend format → Gemini format
    const geminiMessages = messages.map((msg) => ({
      role: msg.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: msg.content }],
    }));

    const cacheName = await getOrCreateCache();

    const baseConfig: Record<string, unknown> = {
      maxOutputTokens: 16384,
    };

    if (cacheName) {
      // Tools are included in the cache — Gemini forbids setting them here
      baseConfig.cachedContent = cacheName;
    } else {
      baseConfig.systemInstruction = SYSTEM_PROMPT;
      baseConfig.tools = toolDeclarations;
    }

    // Build the conversation contents — we'll append tool-call rounds here
    // Typed loosely because Gemini parts can be text, functionCall, or functionResponse
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentContents: any[] = [...geminiMessages];

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          const MAX_TOOL_ROUNDS = 10;

          for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
            const stream = await ai.models.generateContentStream({
              model: MODEL,
              contents: currentContents,
              config: baseConfig,
            });

            let isToolCall = false;
            let hasText = false;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const functionCalls: any[] = [];

            for await (const chunk of stream) {
              // Check for function calls in parts
              const parts = chunk.candidates?.[0]?.content?.parts;
              if (parts) {
                for (const part of parts) {
                  if (part.functionCall) {
                    isToolCall = true;
                    functionCalls.push(part);
                  }
                }
              }

              // Stream text to client (only if this isn't a tool-call round)
              if (!isToolCall && chunk.text) {
                hasText = true;
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ text: chunk.text })}\n\n`
                  )
                );
              }
            }

            // If no tool calls, we're done — text was streamed above
            if (!isToolCall) {
              if (!hasText) {
                console.warn(
                  `[Familiar] Round ${round}: no tool calls and no text — empty response`
                );
              }
              break;
            }

            // Execute tool calls and continue the conversation
            console.log(
              `[Familiar] Round ${round}: executing ${functionCalls.length} tool call(s):`,
              functionCalls.map(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (fc: any) =>
                  `${fc.functionCall.name}(${JSON.stringify(fc.functionCall.args)})`
              )
            );

            currentContents.push({
              role: "model" as const,
              parts: functionCalls,
            });

            const responseParts = functionCalls.map(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (fc: any) => ({
                functionResponse: {
                  name: fc.functionCall.name,
                  response: executeTool(
                    fc.functionCall.name,
                    fc.functionCall.args
                  ),
                },
              })
            );

            console.log(
              `[Familiar] Round ${round}: tool results sent, continuing...`
            );

            currentContents.push({
              role: "user" as const,
              parts: responseParts,
            });
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Stream error";
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: message })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
