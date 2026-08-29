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
      <div className="rounded-xl border border-ink-wash bg-ink-wash p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-moss-dim border border-moss/20 flex items-center justify-center">
            <span className="text-xs font-mono text-moss">{info.icon}</span>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-ink-light">{info.name}</h4>
            <p className="text-[10px] font-mono text-ink-muted">Runs locally, no API key needed</p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full badge-success">
            Always available
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-ink-wash bg-ink-wash p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-vermillion-dim border border-vermillion/20 flex items-center justify-center">
          <span className="text-xs font-mono text-vermillion">{info.icon}</span>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-ink-light">{info.name}</h4>
          <p className="text-[10px] font-mono text-ink-muted">
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
          className="w-full ink-input text-sm font-mono pr-20 placeholder:text-ink-faint"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="p-1.5 rounded-md text-ink-muted hover:text-ink-light hover:bg-ink-wash transition-colors"
            title={showKey ? "Hide key" : "Show key"}
          >
            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!apiKey}
            className="p-1.5 rounded-md text-ink-muted hover:text-ink-light hover:bg-ink-wash transition-colors disabled:opacity-30"
            title="Copy key"
          >
            {copied ? <Check size={14} className="text-moss" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTest}
            disabled={!apiKey || testing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono text-ink-muted hover:text-ink-light hover:bg-ink-wash border border-ink-wash transition-colors disabled:opacity-30"
          >
            <Zap size={12} className={testing ? "animate-pulse" : ""} />
            {testing ? "Testing..." : "Test Connection"}
          </button>
          {apiKey && (
            <button
              type="button"
              onClick={() => onRemoveKey(provider)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono text-ink-muted hover:text-vermillion hover:bg-vermillion-dim transition-colors"
            >
              <Trash2 size={12} />
              Remove
            </button>
          )}
        </div>
        {connected && lastUsed && (
          <span className="text-[10px] font-mono text-ink-faint">
            Last used: {formatLastUsed(lastUsed)}
          </span>
        )}
      </div>
    </div>
  );
}
