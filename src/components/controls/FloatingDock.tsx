'use client';

import React, { useState } from 'react';
import { Mic, MicOff, Send, Volume2, VolumeX, Settings, Trash2 } from 'lucide-react';

interface DockProps {
  onSend: (text: string) => void;
  onToggleListen: () => void;
  listening: boolean;
  speaking: boolean;
  onStopSpeech: () => void;
  onOpenSettings: () => void;
  onClearHistory: () => void;
}

export default function FloatingDock({
  onSend,
  onToggleListen,
  listening,
  speaking,
  onStopSpeech,
  onOpenSettings,
  onClearHistory,
}: DockProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input);
    setInput('');
  };

  return (
    <div className="sticky bottom-0 w-full bg-gradient-to-t from-[#0A0A0C] via-[#0A0A0C]/90 to-transparent pb-6 pt-4 px-4">
      <div className="max-w-3xl mx-auto flex flex-col gap-3">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-2.5 shadow-2xl backdrop-blur-xl"
        >
          <button
            type="button"
            onClick={onToggleListen}
            className={`p-2.5 rounded-xl transition-all ${
              listening
                ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title={listening ? 'Stop listening' : 'Start voice input'}
          >
            {listening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Jarvis or give a voice command..."
            className="flex-1 bg-transparent border-none outline-none text-slate-100 placeholder-slate-500 text-sm font-sans"
          />

          {speaking && (
            <button
              type="button"
              onClick={onStopSpeech}
              className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30 transition-all"
              title="Stop speaking"
            >
              <VolumeX size={20} />
            </button>
          )}

          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2.5 rounded-xl bg-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/30"
          >
            <Send size={20} />
          </button>
        </form>

        <div className="flex items-center justify-between px-2 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span>Project Jarvis PWA • Local First</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClearHistory}
              className="flex items-center gap-1 hover:text-slate-300 transition-colors"
              title="Clear History"
            >
              <Trash2 size={14} /> Clear
            </button>
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1 hover:text-slate-300 transition-colors"
              title="Settings"
            >
              <Settings size={14} /> Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
