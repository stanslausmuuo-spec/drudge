"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Check, Loader2, AlertTriangle } from "lucide-react";

export interface ActivityStep {
  id: string;
  type: "tool_call" | "reasoning" | "response" | "error";
  label: string;
  detail?: string;
  status: "pending" | "running" | "complete" | "error";
  elapsed?: number;
  tool?: string;
  args?: string;
  result?: string;
}

interface ActivityPanelProps {
  steps: ActivityStep[];
  isExpanded: boolean;
  onToggle: () => void;
  onApprove?: (stepId: string) => void;
  onDeny?: (stepId: string) => void;
}

function StepIcon({ status }: { status: ActivityStep["status"] }) {
  switch (status) {
    case "complete":
      return <Check size={11} className="text-moss" />;
    case "running":
      return <Loader2 size={11} className="text-ink-muted animate-spin" />;
    case "error":
      return <AlertTriangle size={11} className="text-vermillion" />;
    default:
      return <div className="w-2.5 h-2.5 rounded-full border border-ink-faint/40" />;
  }
}

export default function ActivityPanel({
  steps,
  isExpanded,
  onToggle,
  onApprove,
  onDeny,
}: ActivityPanelProps) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  if (steps.length === 0) return null;

  const runningCount = steps.filter((s) => s.status === "running").length;
  const completeCount = steps.filter((s) => s.status === "complete").length;
  const pendingApproval = steps.find((s) => s.type === "error" && s.status === "pending");

  return (
    <div className="w-full animate-slide-up">
      {/* Collapsed bar — almost invisible, ink-like */}
      <button
        onClick={onToggle}
        className="ink-press ink-spread w-full flex items-center justify-between px-4 py-2 border border-ink-wash rounded hover:border-ink-wash-strong transition-all duration-300"
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-ink/60">
            Activity
          </span>
          {runningCount > 0 && (
            <span className="flex items-center gap-1.5 text-[9px] font-mono text-ink/60">
              <Loader2 size={9} className="animate-spin" />
              {runningCount} active
            </span>
          )}
          {completeCount > 0 && runningCount === 0 && (
            <span className="text-[9px] font-mono text-moss/80">
              {completeCount} done
            </span>
          )}
        </div>
        <div className="text-ink/40">
          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </div>
      </button>

      {/* Expanded panel */}
      {isExpanded && (
        <div className="border border-t-0 border-ink-wash rounded-b overflow-hidden bg-paper/80 backdrop-blur-sm">
          <div className="max-h-52 overflow-y-auto">
            {steps.map((step, i) => (
              <div
                key={step.id}
                className={`border-b border-ink-wash/50 last:border-b-0 transition-colors duration-300 ${
                  step.status === "running" ? "bg-ochre-dim/30" : ""
                }`}
              >
                <button
                  onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                  className="ink-spread w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-ink-wash/30 transition-colors duration-200"
                >
                  <StepIcon status={step.status} />
                  <span className="flex-1 font-mono text-[11px] text-ink/70 truncate">
                    {step.label}
                  </span>
                  {step.elapsed !== undefined && (
                    <span className="font-mono text-[9px] text-ink/50">
                      {step.elapsed.toFixed(1)}s
                    </span>
                  )}
                  {step.status === "running" && (
                    <div className="w-12 h-[2px] bg-ink-wash rounded-full overflow-hidden">
                      <div
                        className="h-full bg-ink/20 rounded-full animate-pulse-ink"
                        style={{ width: "50%" }}
                      />
                    </div>
                  )}
                </button>

                {/* Step details — progressive disclosure */}
                {expandedStep === step.id && (
                  <div className="px-4 pb-3 pt-0 animate-fade-in">
                    {step.tool && (
                      <div className="mb-2">
                        <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-ink/50">
                          Tool
                        </span>
                        <p className="font-mono text-[11px] text-ink/60 mt-0.5">
                          {step.tool}
                        </p>
                      </div>
                    )}
                    {step.args && (
                      <div className="mb-2">
                        <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-ink/50">
                          Input
                        </span>
                        <pre className="font-mono text-[10px] text-ink/60 mt-0.5 bg-paper-inset/50 rounded p-2 overflow-x-auto border border-ink-wash/30">
                          {step.args}
                        </pre>
                      </div>
                    )}
                    {step.result && (
                      <div className="mb-2">
                        <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-ink/50">
                          Result
                        </span>
                        <pre className="font-mono text-[10px] text-ink/60 mt-0.5 bg-paper-inset/50 rounded p-2 overflow-x-auto max-h-20 overflow-y-auto border border-ink-wash/30">
                          {step.result}
                        </pre>
                      </div>
                    )}
                    {step.detail && (
                      <p className="text-[11px] text-ink/50">{step.detail}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Approval gate */}
          {pendingApproval && onApprove && onDeny && (
            <div className="border-t-2 border-vermillion/30 bg-vermillion-dim/20 px-4 py-3 animate-slide-up">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={12} className="text-vermillion/70" />
                <span className="font-mono text-[9px] font-medium text-vermillion/70 uppercase tracking-[0.15em]">
                  Requires confirmation
                </span>
              </div>
              <p className="text-[11px] text-ink/70 mb-3 font-serif">
                {pendingApproval.detail || pendingApproval.label}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => onApprove(pendingApproval.id)}
                  className="ink-press px-4 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] bg-ink text-paper rounded hover:bg-ink-light transition-colors"
                >
                  Allow
                </button>
                <button
                  onClick={() => onDeny(pendingApproval.id)}
                  className="ink-press px-4 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] border border-ink-wash-strong text-ink-muted rounded hover:bg-ink-wash transition-colors"
                >
                  Deny
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
