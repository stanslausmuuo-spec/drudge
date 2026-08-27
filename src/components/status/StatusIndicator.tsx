"use client";

import React from "react";
import { AgentStatus } from "@/types";

interface StatusIndicatorProps {
  status: AgentStatus;
}

const STATUS_CONFIG: Record<AgentStatus, { label: string; color: string }> = {
  disconnected: { label: "Offline", color: "bg-slate-500" },
  connecting: { label: "Connecting", color: "bg-amber-500" },
  idle: { label: "Ready", color: "bg-emerald-500" },
  listening: { label: "Listening", color: "bg-cyan-500" },
  thinking: { label: "Thinking", color: "bg-blue-500" },
  speaking: { label: "Speaking", color: "bg-cyan-400" },
};

export default function StatusIndicator({ status }: StatusIndicatorProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
      <span className={`w-1.5 h-1.5 rounded-full ${config.color} ${status !== "disconnected" ? "animate-pulse-subtle" : ""}`} />
      <span className="uppercase tracking-[0.12em]">{config.label}</span>
    </div>
  );
}
