"use client";

import React, { useState } from "react";
import { ChevronRight, ChevronLeft, Check, Zap, Shield, Mic, Bot } from "lucide-react";
import { Settings, AIProvider } from "@/types";

interface OnboardingWizardProps {
  isOpen: boolean;
  onComplete: (settings: Settings) => void;
  initialSettings: Settings;
}

interface Step {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  {
    id: "welcome",
    title: "Welcome to Jarvis",
    subtitle: "Your privacy-first AI assistant",
    icon: <Bot size={24} />,
  },
  {
    id: "provider",
    title: "Choose Your AI",
    subtitle: "Select how Jarvis connects to AI models",
    icon: <Zap size={24} />,
  },
  {
    id: "api-key",
    title: "API Key",
    subtitle: "Connect to your AI provider",
    icon: <Shield size={24} />,
  },
  {
    id: "voice",
    title: "Voice Settings",
    subtitle: "Configure how Jarvis speaks",
    icon: <Mic size={24} />,
  },
];

const PROVIDERS = [
  {
    id: "ollama" as AIProvider,
    name: "Ollama (Local)",
    description: "Free, private, runs on your machine",
    icon: "L",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
  },
  {
    id: "openai" as AIProvider,
    name: "OpenAI",
    description: "GPT-4o, fast and capable",
    icon: "O",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
  },
  {
    id: "anthropic" as AIProvider,
    name: "Anthropic",
    description: "Claude, balanced and safe",
    icon: "A",
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/20",
  },
  {
    id: "google" as AIProvider,
    name: "Google AI",
    description: "Gemini, fast and free",
    icon: "G",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
];

const QUICK_ACTIONS = [
  "What can you help me with?",
  "Explain quantum computing",
  "Write a haiku about code",
  "What's the weather like?",
];

export default function OnboardingWizard({
  isOpen,
  onComplete,
  initialSettings,
}: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>("ollama");
  const [apiKey, setApiKey] = useState("");
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechPitch, setSpeechPitch] = useState(1.0);
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      const newSettings: Settings = {
        ...initialSettings,
        defaultProvider: selectedProvider,
        providers:
          selectedProvider !== "ollama" && apiKey
            ? [{ provider: selectedProvider, apiKey, connected: false, lastUsed: null }]
            : [],
        speechRate,
        speechPitch,
      };
      onComplete(newSettings);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const canProceed = () => {
    if (currentStep === 1) return true;
    if (currentStep === 2) return selectedProvider === "ollama" || apiKey.length > 0;
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-jarvis-bg p-4">
      <div className="w-full max-w-md glass-elevated rounded-2xl overflow-hidden animate-fade-in">
        {/* Progress Bar */}
        <div className="h-1 bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Step Content */}
        <div className="px-8 py-10">
          {/* Step Icon */}
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6 mx-auto">
            <div className="text-blue-400">{step.icon}</div>
          </div>

          {/* Step Title */}
          <h2 className="text-xl font-medium text-slate-100 text-center mb-2">{step.title}</h2>
          <p className="text-sm text-slate-400 text-center mb-8">{step.subtitle}</p>

          {/* Step-specific content */}
          {currentStep === 0 && <WelcomeStep />}
          {currentStep === 1 && (
            <ProviderStep
              selectedProvider={selectedProvider}
              onSelect={setSelectedProvider}
            />
          )}
          {currentStep === 2 && (
            <ApiKeyStep
              provider={selectedProvider}
              apiKey={apiKey}
              onApiKeyChange={setApiKey}
              showKey={showKey}
              onToggleShowKey={() => setShowKey(!showKey)}
            />
          )}
          {currentStep === 3 && (
            <VoiceStep
              speechRate={speechRate}
              speechPitch={speechPitch}
              onSpeechRateChange={setSpeechRate}
              onSpeechPitchChange={setSpeechPitch}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="px-8 pb-8 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={isFirstStep}
            className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm transition-colors ${
              isFirstStep
                ? "text-slate-600 cursor-not-allowed"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <ChevronLeft size={16} />
            Back
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
              canProceed()
                ? "bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-500/20"
                : "bg-white/5 text-slate-500 cursor-not-allowed"
            }`}
          >
            {isLastStep ? (
              <>
                <Check size={16} />
                Get Started
              </>
            ) : (
              <>
                Next
                <ChevronRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function WelcomeStep() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: <Mic size={16} />, label: "Voice Control", desc: "Talk naturally" },
          { icon: <Shield size={16} />, label: "100% Private", desc: "Data stays local" },
          { icon: <Zap size={16} />, label: "Fast Responses", desc: "Real-time audio" },
          { icon: <Bot size={16} />, label: "Smart AI", desc: "Multiple models" },
        ].map((feature, i) => (
          <div
            key={i}
            className="glass rounded-xl p-3 flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
              <div className="text-blue-400">{feature.icon}</div>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-200">{feature.label}</p>
              <p className="text-[10px] text-slate-500">{feature.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProviderStep({
  selectedProvider,
  onSelect,
}: {
  selectedProvider: AIProvider;
  onSelect: (p: AIProvider) => void;
}) {
  return (
    <div className="space-y-2">
      {PROVIDERS.map((provider) => (
        <button
          key={provider.id}
          onClick={() => onSelect(provider.id)}
          className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
            selectedProvider === provider.id
              ? `${provider.bgColor} ${provider.borderColor}`
              : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-lg ${provider.bgColor} border ${provider.borderColor} flex items-center justify-center`}
          >
            <span className={`text-sm font-mono ${provider.color}`}>{provider.icon}</span>
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-slate-200">{provider.name}</p>
            <p className="text-[10px] text-slate-500">{provider.description}</p>
          </div>
          {selectedProvider === provider.id && (
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
              <Check size={12} className="text-white" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

function ApiKeyStep({
  provider,
  apiKey,
  onApiKeyChange,
  showKey,
  onToggleShowKey,
}: {
  provider: AIProvider;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  showKey: boolean;
  onToggleShowKey: () => void;
}) {
  if (provider === "ollama") {
    return (
      <div className="glass rounded-xl p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <Check size={20} className="text-emerald-400" />
        </div>
        <p className="text-sm text-slate-200 mb-1">No API key needed</p>
        <p className="text-[10px] text-slate-500">
          Ollama runs locally on your machine. Just make sure Docker is running!
        </p>
      </div>
    );
  }

  const placeholders: Record<AIProvider, string> = {
    openai: "sk-...",
    anthropic: "sk-ant-...",
    google: "AI...",
    ollama: "",
  };

  const instructions: Record<AIProvider, string> = {
    openai: "Get your key from platform.openai.com/api-keys",
    anthropic: "Get your key from console.anthropic.com",
    google: "Get your key from aistudio.google.com",
    ollama: "",
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type={showKey ? "text" : "password"}
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          placeholder={placeholders[provider]}
          className="w-full glass-input text-sm font-mono pr-12"
        />
        <button
          type="button"
          onClick={onToggleShowKey}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
        >
          {showKey ? "Hide" : "Show"}
        </button>
      </div>
      <p className="text-[10px] text-slate-500 text-center">{instructions[provider]}</p>
      <div className="glass rounded-xl p-3">
        <p className="text-[10px] text-slate-400 text-center">
          Your API key is stored locally and never sent to our servers.
        </p>
      </div>
    </div>
  );
}

function VoiceStep({
  speechRate,
  speechPitch,
  onSpeechRateChange,
  onSpeechPitchChange,
}: {
  speechRate: number;
  speechPitch: number;
  onSpeechRateChange: (rate: number) => void;
  onSpeechPitchChange: (pitch: number) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="flex items-center justify-between text-[11px] font-mono text-slate-500 uppercase tracking-[0.12em] mb-3">
          <span>Speech Rate</span>
          <span className="text-slate-400">{speechRate}x</span>
        </label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={speechRate}
          onChange={(e) => onSpeechRateChange(parseFloat(e.target.value))}
        />
        <div className="flex justify-between text-[9px] text-slate-600 mt-1">
          <span>Slow</span>
          <span>Fast</span>
        </div>
      </div>

      <div>
        <label className="flex items-center justify-between text-[11px] font-mono text-slate-500 uppercase tracking-[0.12em] mb-3">
          <span>Speech Pitch</span>
          <span className="text-slate-400">{speechPitch}</span>
        </label>
        <input
          type="range"
          min="0.5"
          max="1.5"
          step="0.1"
          value={speechPitch}
          onChange={(e) => onSpeechPitchChange(parseFloat(e.target.value))}
        />
        <div className="flex justify-between text-[9px] text-slate-600 mt-1">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>

      <div className="glass rounded-xl p-4">
        <p className="text-[10px] text-slate-400 text-center">
          You can adjust these anytime in Settings → Voice
        </p>
      </div>
    </div>
  );
}
