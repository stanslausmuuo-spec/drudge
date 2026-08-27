export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface Settings {
  voiceName: string;
  speechRate: number;
  speechPitch: number;
  systemPrompt: string;
  autoSpeak: boolean;
}
