"use client";

import React, { useState, useEffect, useCallback } from "react";
import AudioVisualizer from "@/components/visualizer/AudioVisualizer";
import ChatFeed from "@/components/chat/ChatFeed";
import FloatingDock from "@/components/controls/FloatingDock";
import SettingsModal from "@/components/settings/SettingsModal";
import StatusIndicator from "@/components/status/StatusIndicator";
import { useLiveKitSession } from "@/lib/livekit/useLiveKitSession";
import {
  getStoredMessages,
  saveStoredMessages,
  getStoredSettings,
  saveStoredSettings,
} from "@/lib/storage/localStorage";
import { Settings } from "@/types";

export default function Home() {
  const [settings, setSettings] = useState<Settings>({
    voiceName: "",
    speechRate: 1.0,
    speechPitch: 1.0,
    systemPrompt:
      "You are Jarvis, an advanced, highly intelligent, privacy-first personal AI assistant.",
    autoSpeak: true,
    sttProvider: "whisper",
    ttsProvider: "piper",
    ollamaModel: "llama3.1",
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);

  const {
    connectionState,
    agentStatus,
    messages,
    setMessages,
    connect,
    disconnect,
    sendMessage,
    toggleMicrophone,
  } = useLiveKitSession();

  useEffect(() => {
    setMessages(getStoredMessages());
    setSettings(getStoredSettings());
  }, [setMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      saveStoredMessages(messages);
    }
  }, [messages]);

  const handleSendMessage = useCallback(
    (text: string) => {
      sendMessage(text);
    },
    [sendMessage]
  );

  const handleClearHistory = useCallback(() => {
    setMessages([]);
    saveStoredMessages([]);
  }, [setMessages]);

  const handleUpdateSettings = useCallback((newSettings: Settings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
  }, []);

  const handleToggleMic = useCallback(async () => {
    await toggleMicrophone();
    setMicEnabled((prev) => !prev);
  }, [toggleMicrophone]);

  return (
    <main className="flex flex-col h-screen bg-[#06080f] text-slate-100 overflow-hidden">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 glass z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <span className="text-sm font-light text-blue-400 font-mono">
              J
            </span>
          </div>
          <div>
            <h1 className="text-xs font-medium tracking-[0.2em] uppercase text-slate-300">
              Jarvis
            </h1>
            <p className="text-[9px] font-mono text-slate-600">
              privacy-first assistant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <StatusIndicator status={agentStatus} />
          <AudioVisualizer status={agentStatus} />
        </div>
      </header>

      <ChatFeed messages={messages} />

      <FloatingDock
        onSend={handleSendMessage}
        onToggleMic={handleToggleMic}
        onConnect={connect}
        onDisconnect={disconnect}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onClearHistory={handleClearHistory}
        agentStatus={agentStatus}
        connectionState={connectionState}
        micEnabled={micEnabled}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />
    </main>
  );
}
