import { promises as fs, existsSync } from "fs";
import path from "path";

export interface JarvisMemory {
  preferences: Record<string, string>;
  facts: string[];
  sessions: Array<{ ts: string; pairs: string[] }>;
}

const DATA_DIR = path.join(process.cwd(), "data");
const MEMORY_FILE = path.join(DATA_DIR, "jarvis-memory.json");

const EMPTY: JarvisMemory = { preferences: {}, facts: [], sessions: [] };

function sanitize(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, 200);
}

const STOP_PHRASES = [
  /^(you are|you're|you re|act as|remember that you|imagine you)/i,
];

function looksLikeFact(text: string): boolean {
  if (text.length < 6 || text.length > 200) return false;
  if (STOP_PHRASES.some((re) => re.test(text))) return false;
  return true;
}

async function ensureStore(): Promise<JarvisMemory> {
  if (!existsSync(MEMORY_FILE)) {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(MEMORY_FILE, JSON.stringify(EMPTY, null, 2), "utf8");
    return { ...EMPTY };
  }
  try {
    const raw = await fs.readFile(MEMORY_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return {
      preferences: parsed.preferences || {},
      facts: Array.isArray(parsed.facts) ? parsed.facts : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    };
  } catch {
    return { ...EMPTY };
  }
}

async function writeStore(memory: JarvisMemory): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = MEMORY_FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(memory, null, 2), "utf8");
  await fs.rename(tmp, MEMORY_FILE);
}

export async function getJarvisMemory(): Promise<JarvisMemory> {
  return ensureStore();
}

export function buildMemoryContext(memory: JarvisMemory): string {
  const parts: string[] = [];
  const prefs = Object.entries(memory.preferences)
    .map(([k, v]) => `${k}: ${v}`)
    .join("; ");
  if (prefs) parts.push(`User preferences/associations: ${prefs}`);
  if (memory.facts.length) parts.push(`Facts I recall about the user: ${memory.facts.join(" | ")}`);
  if (!parts.length) return "";
  return `Long-term memory:\n${parts.join("\n")}`;
}

export async function recordJarvisMemory(
  memory: JarvisMemory,
  userText: string,
  assistantText: string
): Promise<JarvisMemory> {
  const store = memory;
  if (!store.sessions) store.sessions = [];

  const userLine = sanitize(userText);
  const asstLine = sanitize(assistantText);

  if (userLine) {
    const firstPhrase = userLine.split(/[.,;!?]/, 1)[0];
    if (firstPhrase && /^(?:fav|prefer|my name|called|i like|i love|i am|i'm|my favorite|i want|i use|i work|i live)/i.test(firstPhrase)) {
      const eq = firstPhrase.indexOf(" ");
      const key = eq > -1 ? firstPhrase.slice(0, eq).toLowerCase() : "note";
      store.preferences[key] = userLine;
    } else if (looksLikeFact(userLine) && !store.facts.includes(userLine)) {
      store.facts.push(userLine);
      if (store.facts.length > 200) store.facts = store.facts.slice(-200);
    }
  }

  store.sessions.push({ ts: new Date().toISOString(), pairs: [userLine, asstLine].filter(Boolean) });
  store.sessions = store.sessions.slice(-50);

  await writeStore(store);
  return store;
}
