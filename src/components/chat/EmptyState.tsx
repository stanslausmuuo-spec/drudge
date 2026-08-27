"use client";

import React from "react";
import { Mic, MessageSquare, Shield, Zap } from "lucide-react";

interface EmptyStateProps {
  onQuickAction: (action: string) => void;
  isConnected: boolean;
}

const QUICK_ACTIONS = [
  { icon: <MessageSquare size={14} />, label: "What can you help me with?", color: "text-blue-400" },
  { icon: <Zap size={14} />, label: "Explain quantum computing", color: "text-amber-400" },
  { icon: <Shield size={14} />, label: "Why is privacy important?", color: "text-emerald-400" },
  { icon: <Mic size={14} />, label: "Tell me a joke", color: "text-violet-400" },
];

export default function EmptyState({ onQuickAction, isConnected }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center mb-6 animate-pulse-subtle">
        <span className="text-2xl font-light text-blue-400 font-mono">J</span>
      </div>

      {/* Title */}
      <h2 className="text-lg font-medium text-slate-200 mb-2">Hello, I&apos;m Jarvis</h2>
      <p className="text-sm text-slate-500 text-center max-w-sm mb-8">
        Your privacy-first AI assistant. I can help with questions, writing, coding, and more.
        {isConnected ? " Click a suggestion or just start typing." : " Connect to get started."}
      </p>

      {/* Quick Actions */}
      {isConnected && (
        <div className="w-full max-w-md space-y-2">
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-wider mb-3 text-center">
            Try asking
          </p>
          <div className="grid grid-cols-1 gap-2">
            {QUICK_ACTIONS.map((action, i) => (
              <button
                key={i}
                onClick={() => onQuickAction(action.label)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all text-left group"
              >
                <div className={`${action.color} opacity-60 group-hover:opacity-100 transition-opacity`}>
                  {action.icon}
                </div>
                <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Not Connected State */}
      {!isConnected && (
        <div className="glass rounded-xl px-4 py-3 text-center">
          <p className="text-xs text-slate-500">
            Click <span className="text-blue-400">Connect</span> below to start talking with Jarvis
          </p>
        </div>
      )}
    </div>
  );
}
