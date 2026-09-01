"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "next-themes";
import InkStroke from "@/components/visualizer/InkStroke";
import KineticText from "@/components/chat/KineticText";
import ActivityPanel, { ActivityStep } from "@/components/activity/ActivityPanel";
import SettingsPanel from "@/components/settings/SettingsPanel";
import { useLiveKitSession } from "@/lib/livekit/useLiveKitSession";
import {
  getStoredMessages,
  saveStoredMessages,
  getStoredSettings,
  saveStoredSettings,
} from "@/lib/storage/localStorage";
import { useAmbientSound } from "@/lib/audio/useAmbientSound";
import { speakText } from "@/lib/audio/useBrowserSpeech";
import { Settings } from "@/types";

const DEFAULT_SETTINGS: Settings = {
  voiceName: "",
  speechRate: 1.0,
  speechPitch: 1.0,
  systemPrompt:
    "You are Jarvis, an advanced, highly intelligent, privacy-first personal AI assistant.",
  autoSpeak: true,
  sttProvider: "whisper",
  ttsProvider: "piper",
  model: "gemini-2.0-flash",
  defaultProvider: "google",
  providers: [],
  temperature: 0.7,
  maxTokens: 4096,
  theme: "dark",
};

export default function Home() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [input, setInput] = useState("");
  const [activitySteps, setActivitySteps] = useState<ActivityStep[]>([]);
  const [showActivity, setShowActivity] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [, setHasInteracted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const {
    connectionState,
    agentStatus,
    messages,
    setMessages,
    connect,
    sendMessage,
    toggleMicrophone,
    toggleCamera,
    cameraEnabled,
    addMessage,
  } = useLiveKitSession();

  const { playInkStroke, playKeyClick } = useAmbientSound();
  const { setTheme } = useTheme();

  useEffect(() => {
    const stored = getStoredSettings();
    setSettings(stored);
    setMessages(getStoredMessages());
    setTheme(stored.theme);

    const hasCompletedOnboarding = localStorage.getItem("jarvis_onboarded");
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, [setMessages, setTheme]);

  useEffect(() => {
    if (messages.length > 0) {
      saveStoredMessages(messages);
    }
  }, [messages]);

  // Handle local camera preview attachment
  useEffect(() => {
    if (cameraEnabled && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => console.warn("Camera preview error:", err));
    } else if (!cameraEnabled && videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
    }
  }, [cameraEnabled]);

  // Track activity from agent status
  useEffect(() => {
    if (agentStatus === "thinking") {
      setActivitySteps((prev) => {
        const hasRunning = prev.some((s) => s.status === "running");
        if (hasRunning) return prev;
        return [
          ...prev,
          {
            id: `think-${Date.now()}`,
            type: "reasoning" as const,
            label: "processing request",
            status: "running" as const,
          },
        ];
      });
      setShowActivity(true);
    }
    if (agentStatus === "speaking") {
      setActivitySteps((prev) =>
        prev.map((s) =>
          s.status === "running"
            ? { ...s, status: "complete" as const, elapsed: 1.2 }
            : s
        )
      );
      playInkStroke();
    }
  }, [agentStatus]);

  const handleSendMessage = useCallback(async () => {
    if (!input.trim()) return;
    const textToSend = input;
    setInput("");
    
    addMessage("user", textToSend);

    if (connectionState.status === "connected") {
      sendMessage(textToSend);
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages.map(m => ({ role: m.role, content: m.content })), { role: "user", content: textToSend }],
          model: settings.model,
          providers: settings.providers,
          systemPrompt: settings.systemPrompt,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          addMessage("assistant", data.reply);
          if (settings.autoSpeak) {
            playInkStroke();
            speakText(data.reply, settings.speechRate, settings.speechPitch);
          }
        }
      } else {
        const errData = await res.json();
        addMessage("assistant", `Error: ${errData.error || "Please configure your API key in Settings."}`);
      }
    } catch (err) {
      console.warn("Direct chat API fallback error:", err);
      addMessage("assistant", "Network error communicating with AI provider.");
    }
  }, [input, connectionState.status, sendMessage, messages, settings, addMessage, playInkStroke]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  const handleUpdateSettings = useCallback((newSettings: Settings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
    setTheme(newSettings.theme);
  }, [setTheme]);

  const handleToggleMic = useCallback(async () => {
    await toggleMicrophone();
    setMicEnabled((prev) => !prev);
  }, [toggleMicrophone]);

  const handleClearHistory = useCallback(() => {
    setMessages([]);
    saveStoredMessages([]);
    setActivitySteps([]);
  }, [setMessages]);

  const handleConnect = useCallback(() => {
    setHasInteracted(true);
    connect(settings);
  }, [connect, settings]);

  const handleOnboardingComplete = useCallback(() => {
    localStorage.setItem("jarvis_onboarded", "true");
    setShowOnboarding(false);
    setHasInteracted(true);
    setTimeout(() => connect(settings), 300);
  }, [connect, settings]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--mouse-x", `${x}%`);
    el.style.setProperty("--mouse-y", `${y}%`);
  }, []);

  const messagePairs = React.useMemo(() => {
    const pairs: { user: typeof messages[0]; assistant: typeof messages[0] | null }[] = [];
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].role === "user") {
        const assistantMsg = messages[i + 1]?.role === "assistant" ? messages[i + 1] : null;
        pairs.push({ user: messages[i], assistant: assistantMsg });
      }
    }
    return pairs.slice(-3);
  }, [messages]);

  const lastAssistantMessage = [...messages]
    .reverse()
    .find((m) => m.role === "assistant");
  const lastUserMessage = [...messages]
    .reverse()
    .find((m) => m.role === "user");

  const olderPairs = messagePairs.slice(0, -1);
  const latestPair = messagePairs[messagePairs.length - 1];

  const isConnected = connectionState.status === "connected";
  const isConnecting = connectionState.status === "connecting";

  return (
    <main
      className="flex flex-col h-screen bg-paper paper-texture overflow-hidden relative"
      onMouseMove={handleMouseMove}
    >
      <div className="topo-lines" aria-hidden="true" />
      <div className="breathing-warmth" aria-hidden="true" />

      {/* Video Call Preview Tile */}
      {cameraEnabled && (
        <div className="absolute top-16 right-8 z-30 w-48 h-36 bg-ink-wash border border-ink-wash-strong rounded-xl overflow-hidden shadow-2xl animate-fade-in flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-ink/60 text-[9px] font-mono text-paper">
            LIVE VISION
          </div>
        </div>
      )}

      {/* ONBOARDING */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-paper">
          <div className="absolute inset-0 animate-ink-diffuse opacity-[0.03]" />
          <div className="relative text-center px-8 max-w-lg stagger-children">
            <div className="mb-12">
              <svg width="80" height="80" viewBox="0 0 80 80" className="mx-auto opacity-40">
                <path
                  d="M 35 8 Q 37 20, 38 35 Q 39 50, 39 58 Q 39 65, 42 70 Q 46 76, 55 78 Q 62 79, 66 75 Q 70 70, 65 65 Q 60 62, 52 64"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h1 className="font-serif text-5xl font-medium text-ink mb-4 tracking-tight">
              Jarvis
            </h1>
            <p className="text-sm text-ink/70 leading-relaxed mb-3 max-w-xs mx-auto">
              A privacy-first AI assistant & vision companion.
            </p>
            <button
              onClick={handleOnboardingComplete}
              className="ink-press ink-spread group relative px-8 py-3.5 border border-ink-wash-strong text-ink rounded hover:border-ink-light transition-all duration-300"
            >
              <span className="font-mono text-xs uppercase tracking-[0.2em] relative z-10">
                Begin
              </span>
            </button>
            <p className="mt-8 text-[10px] font-mono text-ink/50 uppercase tracking-wider">
              tap to wake
            </p>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="relative z-10 flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-base font-medium text-ink/70 tracking-tight">
            Jarvis
          </h1>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <div
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-700 ${
                isConnected
                  ? "bg-ink/60"
                  : isConnecting
                  ? "bg-ochre animate-pulse-ink"
                  : "bg-ink/30"
              }`}
            />
          </div>
          <button
            onClick={handleClearHistory}
            className="ink-press font-mono text-[10px] uppercase tracking-[0.12em] text-ink/50 hover:text-ink transition-colors duration-300"
          >
            clear
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="ink-press font-mono text-[10px] uppercase tracking-[0.12em] text-ink/50 hover:text-ink transition-colors duration-300"
          >
            settings
          </button>
        </div>
      </header>

      {/* MAIN */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 overflow-hidden">
        <div className="w-full max-w-xl mb-10 animate-ink-bleed">
          <InkStroke status={agentStatus} volume={0} theme={settings.theme} className="mx-auto" />
        </div>

        <div className="w-full max-w-xl min-h-[100px] flex flex-col items-center justify-center">
          {olderPairs.length > 0 && (
            <div className="w-full space-y-6 mb-8">
              {olderPairs.map((pair, idx) => {
                const opacity = 0.2 + (idx / olderPairs.length) * 0.15;
                return (
                  <div
                    key={pair.user.id}
                    className="transition-opacity duration-1000"
                    style={{ opacity }}
                  >
                    <div className="text-right mb-2">
                      <p className="font-serif text-sm text-ink/60 italic">
                        {pair.user.content}
                      </p>
                    </div>
                    {pair.assistant && (
                      <div className="text-left">
                        <p className="font-serif text-sm text-ink/50 leading-relaxed line-clamp-2">
                          {pair.assistant.content}
                        </p>
                      </div>
                    )}
                    <div className="mt-4 mx-auto w-16 h-px bg-gradient-to-r from-transparent via-ink/15 to-transparent" />
                  </div>
                );
              })}
            </div>
          )}

          {latestPair && (
            <>
              <div className="text-right w-full mb-6 animate-ink-settle">
                <p className="font-serif text-lg text-ink/65 italic">
                  {latestPair.user.content}
                </p>
              </div>

              {latestPair.assistant && (
                <div className="text-left w-full animate-ink-bleed">
                  <KineticText
                    text={latestPair.assistant.content}
                    className="font-serif text-ink"
                  />
                </div>
              )}
            </>
          )}

          {!lastAssistantMessage && !lastUserMessage && messagePairs.length === 0 && (
            <div className="text-center stagger-children">
              <p className="font-serif text-[28px] text-ink/40 mb-3 italic">
                {isConnected
                  ? "How can I help?"
                  : isConnecting
                  ? "Waking..."
                  : "Tap to begin"}
              </p>
              {!isConnected && !isConnecting && (
                <button
                  onClick={() => { handleConnect(); playKeyClick(); }}
                  className="ink-press ink-spread mt-2 font-mono text-[10px] uppercase tracking-[0.2em] px-5 py-2.5 border border-ink-wash text-ink-faint rounded hover:border-ink-light hover:text-ink-muted transition-all duration-300"
                >
                  Connect
                </button>
              )}
              {isConnecting && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className="w-1 h-1 rounded-full bg-ink/40 animate-pulse-ink" />
                  <div className="w-1 h-1 rounded-full bg-ink/40 animate-pulse-ink" style={{ animationDelay: "0.3s" }} />
                  <div className="w-1 h-1 rounded-full bg-ink/40 animate-pulse-ink" style={{ animationDelay: "0.6s" }} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ACTIVITY PANEL */}
      <div className="relative z-10 px-8 pb-4">
        <div className="max-w-xl mx-auto">
          <ActivityPanel
            steps={activitySteps}
            isExpanded={showActivity}
            onToggle={() => setShowActivity(!showActivity)}
          />
        </div>
      </div>

      {/* INPUT */}
      <div className="relative z-10 px-8 pb-8">
        <div className="max-w-xl mx-auto">
          {connectionState.error && (
            <div className="mb-4 px-4 py-3 bg-vermillion-dim border border-vermillion/15 rounded text-xs text-vermillion font-mono animate-slide-up">
              {connectionState.error}
            </div>
          )}

          <div className="ink-spread relative flex items-center gap-3 px-5 py-3 border border-ink-wash rounded bg-paper/50 backdrop-blur-sm">
            {/* Mic */}
            <button
              onClick={() => { handleToggleMic(); playKeyClick(); }}
              disabled={!isConnected}
              className={`ink-press p-2 rounded transition-all duration-300 ${
                !isConnected
                  ? "text-ink-faint/30 cursor-not-allowed"
                  : micEnabled
                  ? "text-ink/60 hover:text-ink"
                  : "text-ink-faint hover:text-ink-muted"
              }`}
              title={micEnabled ? "Mute" : "Unmute"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            </button>

            {/* Camera */}
            <button
              onClick={() => { toggleCamera(); playKeyClick(); }}
              disabled={!isConnected}
              className={`ink-press p-2 rounded transition-all duration-300 ${
                !isConnected
                  ? "text-ink-faint/30 cursor-not-allowed"
                  : cameraEnabled
                  ? "text-ink hover:text-ink bg-ink/10"
                  : "text-ink-faint hover:text-ink-muted"
              }`}
              title={cameraEnabled ? "Disable Camera" : "Enable Camera (Video Call)"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 7l-7 5 7 5V7z" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </button>

            {/* Input */}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Jarvis..."
              className="flex-1 bg-transparent border-none outline-none text-ink placeholder-ink-faint/40 text-[15px] font-serif"
            />

            {input.trim() && (
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-ink/10 font-mono text-[10px] text-ink/60 animate-fade-in select-none">
                ↵
              </span>
            )}

            {/* Send */}
            <button
              onClick={() => { handleSendMessage(); playKeyClick(); }}
              disabled={!input.trim()}
              className="ink-press p-2 bg-ink text-paper rounded disabled:opacity-10 disabled:cursor-not-allowed hover:bg-ink-light transition-colors duration-300"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="flex items-center justify-center mt-4">
            <span className="font-mono text-[9px] text-ink/40 uppercase tracking-[0.2em]">
              jarvis · {settings.model}
            </span>
          </div>
        </div>
      </div>

      {isSettingsOpen && (
        <SettingsPanel
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </main>
  );
}
