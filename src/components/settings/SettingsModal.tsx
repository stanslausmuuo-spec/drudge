"use client";

import React from "react";
import { X } from "lucide-react";
import { Settings } from "@/types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onUpdateSettings: (newSettings: Settings) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md glass rounded-2xl p-6 space-y-5 animate-fade-in">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <h2 className="text-sm font-medium text-slate-200 uppercase tracking-wider">
            Configuration
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-[0.15em] mb-2">
              System Prompt
            </label>
            <textarea
              value={settings.systemPrompt}
              onChange={(e) =>
                onUpdateSettings({ ...settings, systemPrompt: e.target.value })
              }
              rows={3}
              className="w-full bg-black/30 border border-white/5 rounded-xl p-3 text-sm text-slate-300 outline-none focus:border-blue-500/30 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-[0.15em] mb-2">
              Speech Rate ({settings.speechRate}x)
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={settings.speechRate}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  speechRate: parseFloat(e.target.value),
                })
              }
              className="w-full accent-blue-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-[0.15em] mb-2">
              Speech Pitch ({settings.speechPitch})
            </label>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={settings.speechPitch}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  speechPitch: parseFloat(e.target.value),
                })
              }
              className="w-full accent-blue-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-[0.15em] mb-2">
              Ollama Model
            </label>
            <select
              value={settings.ollamaModel}
              onChange={(e) =>
                onUpdateSettings({ ...settings, ollamaModel: e.target.value })
              }
              className="w-full bg-black/30 border border-white/5 rounded-xl p-3 text-sm text-slate-300 outline-none focus:border-blue-500/30 transition-colors"
            >
              <option value="llama3.1">Llama 3.1</option>
              <option value="gemma2">Gemma 2</option>
              <option value="mistral">Mistral</option>
              <option value="phi3">Phi-3</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.15em]">
              Auto-speak responses
            </label>
            <button
              onClick={() =>
                onUpdateSettings({ ...settings, autoSpeak: !settings.autoSpeak })
              }
              className={`w-10 h-5 rounded-full transition-colors duration-200 ${
                settings.autoSpeak ? "bg-blue-500/60" : "bg-white/10"
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                  settings.autoSpeak ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-white/5">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-500/80 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
