export const STORAGE_KEY = 'jarvis_messages';
export const SETTINGS_KEY = 'jarvis_settings';

export function getStoredMessages(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveStoredMessages(messages: any[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch (e) {}
}

export function getStoredSettings(): any {
  if (typeof window === 'undefined') {
    return {
      voiceName: '',
      speechRate: 1.0,
      speechPitch: 1.0,
      systemPrompt: 'You are Jarvis, an advanced, highly intelligent, privacy-first personal AI assistant.',
      autoSpeak: true,
    };
  }
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : {
      voiceName: '',
      speechRate: 1.0,
      speechPitch: 1.0,
      systemPrompt: 'You are Jarvis, an advanced, highly intelligent, privacy-first personal AI assistant.',
      autoSpeak: true,
    };
  } catch (e) {
    return {
      voiceName: '',
      speechRate: 1.0,
      speechPitch: 1.0,
      systemPrompt: 'You are Jarvis, an advanced, highly intelligent, privacy-first personal AI assistant.',
      autoSpeak: true,
    };
  }
}

export function saveStoredSettings(settings: any) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {}
}
