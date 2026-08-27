"use client";

import React, { useState } from "react";
import {
  Mic,
  MicOff,
  Send,
  Settings,
  Trash2,
  Wifi,
  WifiOff,
  ChevronDown,
} from "lucide-react";
import { AgentStatus, ConnectionState, AIProvider, AVAILABLE_MODELS } from "@/types";

interface DockProps {
  onSend: (text: string) => void;
  onToggleMic: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onOpenSettings: () => void;
  onClearHistory: () => void;
  agentStatus: AgentStatus;
  connectionState: ConnectionState;
  micEnabled: boolean;
  selectedModel: string;
  selectedProvider: AIProvider;
  onSelectModel: (modelId: string, provider: AIProvider) => void;
}

const PROVIDER_COLORS: Record<AIProvider, string> = {
  openai: "text-emerald-400",
  anthropic: "text-violet-400",
  google: "text-blue-400",
  ollama: "text-amber-400",
};

export default function FloatingDock({
  onSend,
  onToggleMic,
  onConnect,
  onDisconnect,
  onOpenSettings,
  onClearHistory,
  agentStatus,
  connectionState,
  micEnabled,
  selectedModel,
  selectedProvider,
  onSelectModel,
}: DockProps) {
  const [input, setInput] = useState("");
  const [showModelPicker, setShowModelPicker] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || connectionState.status !== "connected") return;
    onSend(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  const isConnected = connectionState.status === "connected";
  const isConnecting = connectionState.status === "connecting";

  const selectedModelData = AVAILABLE_MODELS.find((m) => m.id === selectedModel);

  const groupedModels = AVAILABLE_MODELS.reduce(
    (acc, model) => {
      if (!acc[model.provider]) acc[model.provider] = [];
      acc[model.provider].push(model);
      return acc;
    },
    {} as Record<AIProvider, typeof AVAILABLE_MODELS>
  );

  return (
    <div className="sticky bottom-0 w-full pb-5 pt-3 px-4">
      <div className="max-w-3xl mx-auto flex flex-col gap-2.5">
        {connectionState.error && (
          <div className="glass rounded-xl px-4 py-2.5 text-xs text-red-400/80 font-mono animate-fade-in">
            {connectionState.error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="glass rounded-2xl px-4 py-3 flex items-center gap-3"
        >
          <button
            type="button"
            onClick={onToggleMic}
            disabled={!isConnected}
            className={`p-2 rounded-lg transition-all duration-200 ${
              !isConnected
                ? "text-slate-600 cursor-not-allowed"
                : micEnabled
                ? "text-cyan-400 bg-cyan-500/10"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
            title={micEnabled ? "Mute microphone" : "Unmute microphone"}
          >
            {micEnabled ? <Mic size={18} /> : <MicOff size={18} />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isConnected
                ? "Type a message..."
                : "Connect to start..."
            }
            disabled={!isConnected}
            className="flex-1 bg-transparent border-none outline-none text-slate-200 placeholder-slate-600 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          />

          <button
            type="submit"
            disabled={!input.trim() || !isConnected}
            className="p-2 rounded-lg bg-blue-500/80 text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-blue-500 transition-all duration-200"
          >
            <Send size={18} />
          </button>
        </form>

        <div className="flex items-center justify-between px-1 text-[10px] text-slate-600 font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isConnected
                    ? "bg-emerald-500"
                    : isConnecting
                    ? "bg-amber-500 animate-pulse-subtle"
                    : "bg-slate-600"
                }`}
              />
              {isConnected ? "live" : isConnecting ? "connecting" : "offline"}
            </span>
            <span>jarvis v0.2</span>
          </div>

          <div className="flex items-center gap-2">
            {!isConnected ? (
              <button
                onClick={onConnect}
                disabled={isConnecting}
                className="flex items-center gap-1 hover:text-slate-300 transition-colors disabled:opacity-40"
              >
                <Wifi size={12} />
                {isConnecting ? "Connecting..." : "Connect"}
              </button>
            ) : (
              <button
                onClick={onDisconnect}
                className="flex items-center gap-1 hover:text-slate-300 transition-colors"
              >
                <WifiOff size={12} />
                Disconnect
              </button>
            )}
            <button
              onClick={onClearHistory}
              className="flex items-center gap-1 hover:text-slate-300 transition-colors"
              title="Clear history"
            >
              <Trash2 size={12} />
            </button>
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1 hover:text-slate-300 transition-colors"
              title="Settings"
            >
              <Settings size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
