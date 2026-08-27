export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
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
}

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
