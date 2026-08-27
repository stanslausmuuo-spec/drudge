'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Settings } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onUpdateSettings: (newSettings: Settings) => void;
  voices: SpeechSynthesisVoice[];
}

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  voices,
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-lg font-semibold text-slate-100">Jarvis Configuration</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
              System Prompt
            </label>
            <textarea
              value={settings.systemPrompt}
              onChange={(e) => onUpdateSettings({ ...settings, systemPrompt: e.target.value })}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
              Voice Persona
            </label>
            <select
              value={settings.voiceName}
              onChange={(e) => onUpdateSettings({ ...settings, voiceName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">Default System Voice</option>
              {voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                Speech Rate ({settings.speechRate}x)
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={settings.speechRate}
                onChange={(e) => onUpdateSettings({ ...settings, speechRate: parseFloat(e.target.value) })}
                className="w-full accent-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                Speech Pitch ({settings.speechPitch})
              </label>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={settings.speechPitch}
                onChange={(e) => onUpdateSettings({ ...settings, speechPitch: parseFloat(e.target.value) })}
                className="w-full accent-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors shadow-lg shadow-blue-600/30"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}
