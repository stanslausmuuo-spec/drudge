"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Settings, Bot, Volume2, Info, RotateCcw } from "lucide-react";
import { Settings as SettingsType, AIProvider, ProviderConfig } from "@/types";
import ApiKeyInput from "./ApiKeyInput";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SettingsType;
  onUpdateSettings: (newSettings: SettingsType) => void;
}

type Tab = "general" | "ai-models" | "voice" | "about";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "general", label: "General", icon: <Settings size={14} /> },
  { id: "ai-models", label: "AI Models", icon: <Bot size={14} /> },
  { id: "voice", label: "Voice", icon: <Volume2 size={14} /> },
  { id: "about", label: "About", icon: <Info size={14} /> },
];

const DEFAULT_SETTINGS: SettingsType = {
  voiceName: "",
  speechRate: 1.0,
  speechPitch: 1.0,
  systemPrompt:
    "You are Jarvis, an advanced, highly intelligent, privacy-first personal AI assistant.",
  autoSpeak: true,
  sttProvider: "whisper",
  ttsProvider: "piper",
  ollamaModel: "llama3.1",
  defaultProvider: "ollama",
  providers: [],
  temperature: 0.7,
  maxTokens: 4096,
};

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("general");

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const updateProvider = (provider: AIProvider, key: string) => {
    const providers = [...(settings.providers || [])];
    const existing = providers.findIndex((p) => p.provider === provider);
    if (existing >= 0) {
      providers[existing] = { ...providers[existing], apiKey: key, connected: false };
    } else {
      providers.push({ provider, apiKey: key, connected: false, lastUsed: null });
    }
    onUpdateSettings({ ...settings, providers });
  };

  const removeProviderKey = (provider: AIProvider) => {
    const providers = (settings.providers || []).filter((p) => p.provider !== provider);
    onUpdateSettings({ ...settings, providers });
  };

  const testConnection = async (provider: AIProvider) => {
    const providers = [...(settings.providers || [])];
    const existing = providers.findIndex((p) => p.provider === provider);
    if (existing >= 0) {
      providers[existing] = { ...providers[existing], connected: true, lastUsed: Date.now() };
      onUpdateSettings({ ...settings, providers });
    }
  };

  const getProviderConfig = (provider: AIProvider): ProviderConfig => {
    return (
      settings.providers?.find((p) => p.provider === provider) || {
        provider,
        apiKey: "",
        connected: false,
        lastUsed: null,
      }
    );
  };

  const handleResetDefaults = () => {
    onUpdateSettings(DEFAULT_SETTINGS);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div className="w-full max-w-lg glass-elevated rounded-2xl animate-fade-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 id="settings-title" className="text-sm font-medium text-slate-200 uppercase tracking-wider">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-white/5"
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 px-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
                activeTab === tab.id ? "tab-active" : "tab-inactive"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          {activeTab === "general" && (
            <GeneralTab settings={settings} onUpdate={onUpdateSettings} />
          )}
          {activeTab === "ai-models" && (
            <AIModelsTab
              settings={settings}
              onUpdate={onUpdateSettings}
              onUpdateProvider={updateProvider}
              onRemoveProvider={removeProviderKey}
              onTestConnection={testConnection}
              getProviderConfig={getProviderConfig}
            />
          )}
          {activeTab === "voice" && (
            <VoiceTab settings={settings} onUpdate={onUpdateSettings} />
          )}
          {activeTab === "about" && <AboutTab />}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
          >
            <RotateCcw size={12} />
            Reset to Defaults
          </button>
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

function GeneralTab({
  settings,
  onUpdate,
}: {
  settings: SettingsType;
  onUpdate: (s: SettingsType) => void;
}) {
  return (
    <div className="space-y-5">
      <SectionHeader title="System Prompt" description="Customize Jarvis's personality and behavior" />
      <textarea
        value={settings.systemPrompt}
        onChange={(e) => onUpdate({ ...settings, systemPrompt: e.target.value })}
        rows={4}
        className="w-full glass-input text-sm text-slate-300 resize-none"
      />

      <SectionHeader title="AI Provider" description="Select your default AI provider" />
      <select
        value={settings.defaultProvider}
        onChange={(e) => onUpdate({ ...settings, defaultProvider: e.target.value as AIProvider })}
        className="w-full glass-input text-sm text-slate-300"
      >
        <option value="ollama">Ollama (Local)</option>
        <option value="openai">OpenAI</option>
        <option value="anthropic">Anthropic</option>
        <option value="google">Google AI</option>
      </select>

      <SectionHeader title="Model" description="Choose the AI model to use" />
      <select
        value={settings.ollamaModel}
        onChange={(e) => onUpdate({ ...settings, ollamaModel: e.target.value })}
        className="w-full glass-input text-sm text-slate-300"
      >
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
        <optgroup label="Local (Ollama)">
          <option value="llama3.1">Llama 3.1</option>
          <option value="gemma2">Gemma 2</option>
          <option value="mistral">Mistral</option>
          <option value="phi3">Phi-3</option>
        </optgroup>
      </select>

      <SectionHeader title="Advanced" description="Fine-tune model behavior" />
      <div className="space-y-4">
        <div>
          <label className="flex items-center justify-between text-[11px] font-mono text-slate-500 uppercase tracking-[0.12em] mb-2">
            <span>Temperature</span>
            <span className="text-slate-400">{settings.temperature}</span>
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={settings.temperature}
            onChange={(e) => onUpdate({ ...settings, temperature: parseFloat(e.target.value) })}
          />
        </div>
        <div>
          <label className="flex items-center justify-between text-[11px] font-mono text-slate-500 uppercase tracking-[0.12em] mb-2">
            <span>Max Tokens</span>
            <span className="text-slate-400">{settings.maxTokens}</span>
          </label>
          <input
            type="range"
            min="256"
            max="8192"
            step="256"
            value={settings.maxTokens}
            onChange={(e) => onUpdate({ ...settings, maxTokens: parseInt(e.target.value) })}
          />
        </div>
      </div>
    </div>
  );
}

function AIModelsTab({
  settings,
  onUpdate,
  onUpdateProvider,
  onRemoveProvider,
  onTestConnection,
  getProviderConfig,
}: {
  settings: SettingsType;
  onUpdate: (s: SettingsType) => void;
  onUpdateProvider: (p: AIProvider, k: string) => void;
  onRemoveProvider: (p: AIProvider) => void;
  onTestConnection: (p: AIProvider) => void;
  getProviderConfig: (p: AIProvider) => ProviderConfig;
}) {
  return (
    <div className="space-y-4">
      <SectionHeader
        title="Provider API Keys"
        description="Add your API keys to use cloud-based AI models"
      />
      <div className="space-y-3">
        {(["openai", "anthropic", "google", "ollama"] as AIProvider[]).map((provider) => {
          const config = getProviderConfig(provider);
          return (
            <ApiKeyInput
              key={provider}
              provider={provider}
              apiKey={config.apiKey}
              connected={config.connected}
              lastUsed={config.lastUsed}
              onUpdateKey={onUpdateProvider}
              onRemoveKey={onRemoveProvider}
              onTestConnection={onTestConnection}
            />
          );
        })}
      </div>
    </div>
  );
}

function VoiceTab({
  settings,
  onUpdate,
}: {
  settings: SettingsType;
  onUpdate: (s: SettingsType) => void;
}) {
  return (
    <div className="space-y-5">
      <SectionHeader title="Speech Settings" description="Configure voice synthesis parameters" />

      <div>
        <label className="flex items-center justify-between text-[11px] font-mono text-slate-500 uppercase tracking-[0.12em] mb-2">
          <span>Speech Rate</span>
          <span className="text-slate-400">{settings.speechRate}x</span>
        </label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={settings.speechRate}
          onChange={(e) => onUpdate({ ...settings, speechRate: parseFloat(e.target.value) })}
        />
      </div>

      <div>
        <label className="flex items-center justify-between text-[11px] font-mono text-slate-500 uppercase tracking-[0.12em] mb-2">
          <span>Speech Pitch</span>
          <span className="text-slate-400">{settings.speechPitch}</span>
        </label>
        <input
          type="range"
          min="0.5"
          max="1.5"
          step="0.1"
          value={settings.speechPitch}
          onChange={(e) => onUpdate({ ...settings, speechPitch: parseFloat(e.target.value) })}
        />
      </div>

      <div>
        <label className="block text-[11px] font-mono text-slate-500 uppercase tracking-[0.12em] mb-2">
          Voice
        </label>
        <select
          value={settings.voiceName}
          onChange={(e) => onUpdate({ ...settings, voiceName: e.target.value })}
          className="w-full glass-input text-sm text-slate-300"
        >
          <option value="en_US-lessac-medium">Lessac (Medium)</option>
          <option value="en_US-lessac-low">Lessac (Low)</option>
          <option value="en_US-amy-medium">Amy (Medium)</option>
        </select>
      </div>

      <div className="flex items-center justify-between py-2">
        <div>
          <p className="text-xs text-slate-300">Auto-speak responses</p>
          <p className="text-[10px] text-slate-500">Automatically play AI responses as speech</p>
        </div>
        <button
          onClick={() => onUpdate({ ...settings, autoSpeak: !settings.autoSpeak })}
          className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
            settings.autoSpeak ? "bg-blue-500/60" : "bg-white/10"
          }`}
          role="switch"
          aria-checked={settings.autoSpeak}
        >
          <span
            className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
              settings.autoSpeak ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <SectionHeader title="STT Provider" description="Speech-to-text engine" />
      <select
        value={settings.sttProvider}
        onChange={(e) => onUpdate({ ...settings, sttProvider: e.target.value as "whisper" | "deepgram" })}
        className="w-full glass-input text-sm text-slate-300"
      >
        <option value="whisper">Whisper (Local)</option>
        <option value="deepgram">Deepgram (Cloud)</option>
      </select>

      <SectionHeader title="TTS Provider" description="Text-to-speech engine" />
      <select
        value={settings.ttsProvider}
        onChange={(e) => onUpdate({ ...settings, ttsProvider: e.target.value as "piper" | "deepgram" })}
        className="w-full glass-input text-sm text-slate-300"
      >
        <option value="piper">Piper (Local)</option>
        <option value="deepgram">Deepgram (Cloud)</option>
      </select>
    </div>
  );
}

function AboutTab() {
  return (
    <div className="space-y-5">
      <SectionHeader title="About Jarvis" description="Privacy-first AI assistant" />
      <div className="space-y-3 text-sm text-slate-400">
        <p>
          Jarvis is a fully local, voice-enabled AI assistant. All processing runs on your machine —
          no data ever leaves your device.
        </p>
        <div className="glass rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Version</span>
            <span className="font-mono text-slate-400">0.2.0</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Frontend</span>
            <span className="font-mono text-slate-400">Next.js 14</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Agent</span>
            <span className="font-mono text-slate-400">LiveKit + Python</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Voice</span>
            <span className="font-mono text-slate-400">Whisper + Piper</span>
          </div>
        </div>
        <p className="text-[10px] text-slate-600">
          Built with privacy in mind. Your conversations never leave your device.
        </p>
      </div>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h3 className="text-xs font-medium text-slate-300 uppercase tracking-wider">{title}</h3>
      <p className="text-[10px] text-slate-500 mt-0.5">{description}</p>
    </div>
  );
}
