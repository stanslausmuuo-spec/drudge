"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Copy, Check, Zap, Trash2 } from "lucide-react";
import { AIProvider } from "@/types";

interface ApiKeyInputProps {
  provider: AIProvider;
  apiKey: string;
  connected: boolean;
  lastUsed: number | null;
  onUpdateKey: (provider: AIProvider, key: string) => void;
  onRemoveKey: (provider: AIProvider) => void;
  onTestConnection: (provider: AIProvider) => void;
}

const PROVIDER_INFO: Record<AIProvider, { name: string; icon: string; placeholder: string }> = {
  openai: { name: "OpenAI", icon: "O", placeholder: "sk-..." },
  anthropic: { name: "Anthropic", icon: "A", placeholder: "sk-ant-..." },
  google: { name: "Google AI", icon: "G", placeholder: "AI..." },
  ollama: { name: "Ollama (Local)", icon: "L", placeholder: "No key needed" },
};

export default function ApiKeyInput({
  provider,
  apiKey,
  connected,
  lastUsed,
  onUpdateKey,
  onRemoveKey,
  onTestConnection,
}: ApiKeyInputProps) {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const info = PROVIDER_INFO[provider];

  const handleCopy = async () => {
    if (!apiKey) return;
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTest = async () => {
    setTesting(true);
    await onTestConnection(provider);
    setTimeout(() => setTesting(false), 1500);
  };

  const formatLastUsed = (ts: number | null) => {
    if (!ts) return "Never";
    const diff = Date.now() - ts;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  if (provider === "ollama") {
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <span className="text-xs font-mono text-emerald-400">{info.icon}</span>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-slate-200">{info.name}</h4>
            <p className="text-[10px] font-mono text-slate-500">Runs locally, no API key needed</p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full badge-success">
            Always available
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <span className="text-xs font-mono text-blue-400">{info.icon}</span>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-slate-200">{info.name}</h4>
          <p className="text-[10px] font-mono text-slate-500">
            {connected ? "Connected" : "Not configured"}
          </p>
        </div>
        {connected && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full badge-success">
            Connected
          </span>
        )}
      </div>

      <div className="relative">
        <input
          type={showKey ? "text" : "password"}
          value={apiKey}
          onChange={(e) => onUpdateKey(provider, e.target.value)}
          placeholder={info.placeholder}
          className="w-full glass-input text-sm font-mono pr-20 placeholder:text-slate-600"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
            title={showKey ? "Hide key" : "Show key"}
          >
            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!apiKey}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors disabled:opacity-30"
            title="Copy key"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTest}
            disabled={!apiKey || testing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-white/5 transition-colors disabled:opacity-30"
          >
            <Zap size={12} className={testing ? "animate-pulse" : ""} />
            {testing ? "Testing..." : "Test Connection"}
          </button>
          {apiKey && (
            <button
              type="button"
              onClick={() => onRemoveKey(provider)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-colors"
            >
              <Trash2 size={12} />
              Remove
            </button>
          )}
        </div>
        {connected && lastUsed && (
          <span className="text-[10px] font-mono text-slate-600">
            Last used: {formatLastUsed(lastUsed)}
          </span>
        )}
      </div>
    </div>
  );
}
