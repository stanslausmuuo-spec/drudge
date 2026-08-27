export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export type AIProvider = "openai" | "anthropic" | "google" | "ollama";

export interface ProviderConfig {
  provider: AIProvider;
  apiKey: string;
  connected: boolean;
  lastUsed: number | null;
}

export interface Settings {
  voiceName: string;
  speechRate: number;
  speechPitch: number;
  systemPrompt: string;
  autoSpeak: boolean;
  sttProvider: "whisper" | "deepgram";
  ttsProvider: "piper" | "deepgram";
  ollamaModel: string;
  defaultProvider: AIProvider;
  providers: ProviderConfig[];
  temperature: number;
  maxTokens: number;
}

export interface ModelOption {
  id: string;
  name: string;
  provider: AIProvider;
  description: string;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  { id: "gpt-4o", name: "GPT-4o", provider: "openai", description: "Fast, general-purpose" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai", description: "Quick tasks" },
  { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", provider: "anthropic", description: "Balanced" },
  { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", provider: "anthropic", description: "Fast & capable" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "google", description: "Fast & free" },
  { id: "llama3.1", name: "Llama 3.1", provider: "ollama", description: "Local, private" },
  { id: "gemma2", name: "Gemma 2", provider: "ollama", description: "Local, fast" },
  { id: "mistral", name: "Mistral", provider: "ollama", description: "Local, efficient" },
  { id: "phi3", name: "Phi-3", provider: "ollama", description: "Local, compact" },
];

export type AgentStatus =
  | "disconnected"
  | "connecting"
  | "idle"
  | "listening"
  | "thinking"
  | "speaking";

export interface ConnectionState {
  status: "disconnected" | "connecting" | "connected";
  error: string | null;
}
