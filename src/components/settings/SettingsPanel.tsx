"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Settings, AIProvider, ProviderConfig } from "@/types";
import ApiKeyInput from "./ApiKeyInput";

interface SettingsPanelProps {
  settings: Settings;
  onUpdateSettings: (settings: Settings) => void;
  onClose: () => void;
}

type TabType = "general" | "ai" | "voice" | "plugins" | "about";

export default function SettingsPanel({
  settings,
  onUpdateSettings,
  onClose,
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("general");

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const getProviderConfig = (provider: AIProvider): ProviderConfig => {
    const existing = settings.providers?.find((p) => p.provider === provider);
    return existing || { provider, apiKey: "", connected: false, lastUsed: null };
  };

  const handleUpdateKey = (provider: AIProvider, apiKey: string) => {
    const providers = settings.providers ? [...settings.providers] : [];
    const index = providers.findIndex((p) => p.provider === provider);
    const connected = apiKey.trim().length > 5;
    if (index >= 0) {
      providers[index] = { ...providers[index], apiKey, connected, lastUsed: connected ? Date.now() : null };
    } else {
      providers.push({ provider, apiKey, connected, lastUsed: connected ? Date.now() : null });
    }
    onUpdateSettings({ ...settings, providers });
  };

  const handleRemoveKey = (provider: AIProvider) => {
    const providers = settings.providers ? settings.providers.filter((p) => p.provider !== provider) : [];
    onUpdateSettings({ ...settings, providers });
  };

  const handleTestConnection = async (provider: AIProvider) => {
    // Simulate test connection
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const config = getProviderConfig(provider);
    if (config.apiKey.trim().length > 5) {
      handleUpdateKey(provider, config.apiKey);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/5 backdrop-blur-[1px] animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-paper border-l border-ink-wash h-full overflow-y-auto animate-ink-bleed settings-panel flex flex-col">
        {/* Paper texture overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02] settings-panel-texture" />

        {/* Header */}
        <div className="relative flex items-center justify-between px-8 py-6 border-b border-ink-wash">
          <div>
            <h2 className="font-serif text-xl font-medium text-ink">Settings</h2>
            <p className="font-mono text-[10px] text-ink-faint uppercase tracking-wider mt-1">
              Configure assistant & models
            </p>
          </div>
          <button
            onClick={onClose}
            className="ink-press p-2 text-ink-muted hover:text-ink transition-colors rounded hover:bg-ink-wash"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-ink-wash px-8 bg-paper/80">
          {(
            [
              ["general", "General"],
              ["ai", "AI Models"],
              ["voice", "Voice"],
              ["plugins", "Plugins"],
              ["about", "About"],
            ] as const
          ).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-3 font-mono text-[10px] uppercase tracking-wider border-b-2 transition-colors ${
                activeTab === tab
                  ? "tab-active font-medium"
                  : "tab-inactive hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="relative flex-1 px-8 py-6 space-y-8 overflow-y-auto">
          {activeTab === "general" && (
            <>
              {/* System Prompt */}
              <section className="animate-slide-up">
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
              </section>

              {/* Theme */}
              <section className="animate-slide-up">
                <label className="block font-mono text-[9px] uppercase tracking-[0.15em] text-ink-faint mb-3">
                  Appearance
                </label>
                <div className="flex gap-2">
                  {(["dark", "neon", "light", "system"] as const).map((mode) => (
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

              {/* Model */}
              <section className="animate-slide-up">
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
                     <option value="gpt-4o-realtime-preview">GPT-4o Realtime (Native Voice)</option>
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

              {/* Temperature */}
              <section className="animate-slide-up">
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
                  className="w-full accent-ink"
                />
              </section>

              {/* Max Tokens */}
              <section className="animate-slide-up">
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
                  className="w-full accent-ink"
                />
              </section>
            </>
          )}

          {activeTab === "ai" && (
            <div className="space-y-4 animate-slide-up">
              <p className="text-xs text-ink/70 font-serif mb-4">
                Paste your API keys here to use cloud models (OpenAI, Anthropic, Google) alongside local Ollama.
              </p>
              {(["openai", "anthropic", "google", "ollama"] as AIProvider[]).map((prov) => {
                const conf = getProviderConfig(prov);
                return (
                  <ApiKeyInput
                    key={prov}
                    provider={prov}
                    apiKey={conf.apiKey}
                    connected={conf.connected}
                    lastUsed={conf.lastUsed}
                    onUpdateKey={handleUpdateKey}
                    onRemoveKey={handleRemoveKey}
                    onTestConnection={handleTestConnection}
                  />
                );
              })}
            </div>
          )}

          {activeTab === "voice" && (
            <div className="space-y-6 animate-slide-up">
              <div className="grid grid-cols-2 gap-6">
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
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-ink-wash">
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
              </div>
            </div>
          )}

          {activeTab === "plugins" && (
            <div className="space-y-4 animate-slide-up">
              <div className="p-4 rounded-xl border border-ink-wash bg-ink-wash/50 space-y-2">
                <h4 className="font-serif text-sm font-medium text-ink">Plugin Manager (Mark-LI)</h4>
                <p className="text-xs text-ink/70 font-serif leading-relaxed">
                  Drop custom Python plugins into <code className="font-mono text-[10px]">agent/plugins/</code> to extend Jarvis with new skills dynamically.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-ink-wash bg-paper">
                  <div>
                    <p className="font-serif text-sm text-ink">sample_plugin</p>
                    <p className="font-mono text-[10px] text-ink-faint">v1.0.0 · Active & Loaded</p>
                  </div>
                  <span className="font-mono text-[10px] uppercase px-2 py-1 rounded bg-ink/10 text-ink">
                    Enabled
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "about" && (
            <div className="space-y-4 animate-slide-up">
              <div className="p-4 rounded-xl border border-ink-wash bg-ink-wash/50 space-y-2">
                <h4 className="font-serif text-sm font-medium text-ink">Project Jarvis</h4>
                <p className="text-xs text-ink/70 font-serif leading-relaxed">
                  A privacy-first, voice-enabled personal AI assistant powered by LiveKit, Ollama, and local or cloud LLMs.
                </p>
              </div>
              <div className="space-y-2.5 pt-2">
                {[
                  ["Version", "0.2.0"],
                  ["Voice Transport", "LiveKit WebRTC"],
                  ["Privacy", "Local & Self-Hosted"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between">
                    <span className="text-[11px] text-ink-faint font-mono uppercase tracking-wider">
                      {label}
                    </span>
                    <span className="text-[11px] text-ink/60 font-mono">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="relative px-8 py-5 border-t border-ink-wash bg-paper">
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
