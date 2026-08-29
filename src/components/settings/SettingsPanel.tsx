"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { Settings } from "@/types";

interface SettingsPanelProps {
  settings: Settings;
  onUpdateSettings: (settings: Settings) => void;
  onClose: () => void;
}

export default function SettingsPanel({
  settings,
  onUpdateSettings,
  onClose,
}: SettingsPanelProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      {/* Backdrop — ink wash fade */}
      <div
        className="absolute inset-0 bg-ink/5 backdrop-blur-[1px] animate-fade-in"
        onClick={onClose}
      />

        {/* Panel — journal page */}
        <div className="relative w-full max-w-md bg-paper border-l border-ink-wash h-full overflow-y-auto animate-ink-bleed settings-panel">
        {/* Paper texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.02] settings-panel-texture"
        />

        {/* Header */}
        <div className="relative flex items-center justify-between px-8 py-6 border-b border-ink-wash">
          <div>
            <h2 className="font-serif text-xl font-medium text-ink">Settings</h2>
            <p className="font-mono text-[10px] text-ink-faint uppercase tracking-wider mt-1">
              Configure your assistant
            </p>
          </div>
          <button
            onClick={onClose}
            className="ink-press p-2 text-ink-muted hover:text-ink transition-colors rounded hover:bg-ink-wash"
          >
            <X size={16} />
          </button>
        </div>

        <div className="relative px-8 py-6 space-y-8">
          {/* System Prompt — journal entry style */}
          <section className="animate-slide-up" style={{ animationDelay: "0ms" }}>
            <label className="block font-mono text-[9px] uppercase tracking-[0.15em] text-ink-faint mb-3">
              System Prompt
            </label>
            <div className="relative">
              <textarea
                value={settings.systemPrompt}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, systemPrompt: e.target.value })
                }
                rows={5}
                className="w-full bg-transparent border-none outline-none text-ink/80 text-sm leading-relaxed resize-none font-serif placeholder-ink-faint/40"
                placeholder="Who should Jarvis be?"
              />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-ink-wash-strong to-transparent" />
            </div>
            <p className="mt-2 text-[10px] text-ink-faint/50 italic font-serif">
              This is the first thing Jarvis reads. Write as if introducing yourself.
            </p>
          </section>

          {/* Theme — primary visual choice */}
          <section className="animate-slide-up" style={{ animationDelay: "0ms" }}>
            <label className="block font-mono text-[9px] uppercase tracking-[0.15em] text-ink-faint mb-3">
              Appearance
            </label>
            <div className="flex gap-2">
              {(["paper", "neon", "system"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onUpdateSettings({ ...settings, theme: mode })}
                  className={`ink-press flex-1 py-2 px-3 rounded border text-[11px] font-mono uppercase tracking-[0.1em] transition-all duration-300 ${
                    settings.theme === mode
                      ? "border-ink bg-ink text-paper"
                      : "border-ink-wash-strong text-ink-muted hover:border-ink-light"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </section>

          {/* Model — handwritten note style */}
          <section className="animate-slide-up" style={{ animationDelay: "60ms" }}>
            <label className="block font-mono text-[9px] uppercase tracking-[0.15em] text-ink-faint mb-3">
              Model
            </label>
            <select
              value={settings.ollamaModel}
              onChange={(e) =>
                onUpdateSettings({ ...settings, ollamaModel: e.target.value })
              }
              className="w-full bg-transparent border-b border-ink-wash-strong pb-2 text-ink text-sm font-serif outline-none appearance-none cursor-pointer hover:border-ink-light transition-colors"
            >
              <optgroup label="Local">
                <option value="llama3.1">Llama 3.1</option>
                <option value="gemma2">Gemma 2</option>
                <option value="mistral">Mistral</option>
                <option value="phi3">Phi-3</option>
              </optgroup>
              <optgroup label="OpenAI">
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
              </optgroup>
              <optgroup label="Anthropic">
                <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
                <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
              </optgroup>
              <optgroup label="Google">
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
              </optgroup>
            </select>
          </section>

          {/* Temperature — margin note */}
          <section className="animate-slide-up" style={{ animationDelay: "120ms" }}>
            <div className="flex items-baseline justify-between mb-3">
              <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-ink-faint">
                Temperature
              </label>
              <span className="font-serif text-sm text-ink/50 italic">
                {settings.temperature}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={settings.temperature}
              onChange={(e) =>
                onUpdateSettings({ ...settings, temperature: parseFloat(e.target.value) })
              }
            />
            <div className="flex justify-between mt-1.5">
              <span className="text-[9px] text-ink-faint/40 font-mono">precise</span>
              <span className="text-[9px] text-ink-faint/40 font-mono">creative</span>
            </div>
          </section>

          {/* Max Tokens */}
          <section className="animate-slide-up" style={{ animationDelay: "180ms" }}>
            <div className="flex items-baseline justify-between mb-3">
              <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-ink-faint">
                Max Tokens
              </label>
              <span className="font-serif text-sm text-ink/50 italic">
                {settings.maxTokens}
              </span>
            </div>
            <input
              type="range"
              min="256"
              max="8192"
              step="256"
              value={settings.maxTokens}
              onChange={(e) =>
                onUpdateSettings({ ...settings, maxTokens: parseInt(e.target.value) })
              }
            />
          </section>

          {/* Divider — ink wash line */}
          <div className="h-px bg-gradient-to-r from-transparent via-ink-wash-strong to-transparent" />

          {/* STT / TTS — side by side */}
          <section className="grid grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: "240ms" }}>
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-[0.15em] text-ink-faint mb-3">
                Speech to Text
              </label>
              <select
                value={settings.sttProvider}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, sttProvider: e.target.value as "whisper" | "deepgram" })
                }
                className="w-full bg-transparent border-b border-ink-wash-strong pb-2 text-ink text-sm font-serif outline-none appearance-none cursor-pointer hover:border-ink-light transition-colors"
              >
                <option value="whisper">Whisper</option>
                <option value="deepgram">Deepgram</option>
              </select>
            </div>
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-[0.15em] text-ink-faint mb-3">
                Text to Speech
              </label>
              <select
                value={settings.ttsProvider}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, ttsProvider: e.target.value as "piper" | "deepgram" })
                }
                className="w-full bg-transparent border-b border-ink-wash-strong pb-2 text-ink text-sm font-serif outline-none appearance-none cursor-pointer hover:border-ink-light transition-colors"
              >
                <option value="piper">Piper</option>
                <option value="deepgram">Deepgram</option>
              </select>
            </div>
          </section>

          {/* Auto Speak — toggle */}
          <section className="flex items-center justify-between animate-slide-up" style={{ animationDelay: "300ms" }}>
            <div>
              <p className="text-sm text-ink/70 font-serif">Auto-speak</p>
              <p className="text-[10px] text-ink-faint font-mono">Play responses as speech</p>
            </div>
            <button
              onClick={() => onUpdateSettings({ ...settings, autoSpeak: !settings.autoSpeak })}
              className={`ink-press relative w-10 h-[18px] rounded-full transition-all duration-500 ${
                settings.autoSpeak ? "bg-ink/60" : "bg-ink-wash-strong"
              }`}
              role="switch"
              aria-checked={settings.autoSpeak}
            >
              <span
                className={`absolute top-[2px] left-[2px] w-[14px] h-[14px] rounded-full bg-paper transition-all duration-500 shadow-sm ${
                  settings.autoSpeak
                    ? "translate-x-[22px] scale-100"
                    : "translate-x-0 scale-90"
                }`}
              />
            </button>
          </section>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-ink-wash-strong to-transparent" />

          {/* About — colophon style */}
          <section className="animate-slide-up" style={{ animationDelay: "360ms" }}>
            <div className="space-y-2.5">
              {[
                ["Version", "0.2.0"]
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between">
                  <span className="text-[11px] text-ink-faint font-mono uppercase tracking-wider">
                    {label}
                  </span>
                  <span className="text-[11px] text-ink/40 font-mono">{value}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="relative px-8 py-5 border-t border-ink-wash">
          <button
            onClick={onClose}
            className="ink-press ink-spread w-full py-3 bg-ink text-paper font-mono text-[10px] uppercase tracking-[0.2em] rounded hover:bg-ink-light transition-colors duration-300"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
