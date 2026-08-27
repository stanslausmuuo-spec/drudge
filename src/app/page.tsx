'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AudioVisualizer from '@/components/visualizer/AudioVisualizer';
import ChatFeed from '@/components/chat/ChatFeed';
import FloatingDock from '@/components/controls/FloatingDock';
import SettingsModal from '@/components/settings/SettingsModal';
import { useSpeechSynthesis, useSpeechRecognition } from '@/lib/speech/useSpeech';
import {
  getStoredMessages,
  saveStoredMessages,
  getStoredSettings,
  saveStoredSettings,
} from '@/lib/storage/localStorage';
import { Message, Settings } from '@/types';
import { Shield } from 'lucide-react';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [settings, setSettings] = useState<Settings>({
    voiceName: '',
    speechRate: 1.0,
    speechPitch: 1.0,
    systemPrompt: 'You are Jarvis, an advanced, highly intelligent, privacy-first personal AI assistant.',
    autoSpeak: true,
  });
  const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { speak, stop, speaking, voices } = useSpeechSynthesis();

  // Load stored data on mount
  useEffect(() => {
    setMessages(getStoredMessages());
    setSettings(getStoredSettings());
  }, []);

  // Update status based on speaking/listening state
  useEffect(() => {
    if (speaking) {
      setStatus('speaking');
    } else if (status === 'speaking') {
      setStatus('idle');
    }
  }, [speaking]);

  const handleSendMessage = useCallback(
    async (text: string) => {
      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: text,
        timestamp: Date.now(),
      };

      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      saveStoredMessages(updatedMessages);

      setStatus('thinking');

      // Simulate intelligent response generation based on prompt
      setTimeout(() => {
        let replyContent = `I have received your command: "${text}". As your privacy-first assistant, all processing remains secure and local.`;
        
        const lower = text.toLowerCase();
        if (lower.includes('hello') || lower.includes('hi')) {
          replyContent = "Greetings. Jarvis systems are fully operational and secured.";
        } else if (lower.includes('time')) {
          replyContent = `Current system time is ${new Date().toLocaleTimeString()}.`;
        } else if (lower.includes('status')) {
          replyContent = "All local IndexedDB services, speech synthesis pipelines, and waveform renderers are operating at optimal 60 FPS performance.";
        }

        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: replyContent,
          timestamp: Date.now(),
        };

        const finalMessages = [...updatedMessages, assistantMsg];
        setMessages(finalMessages);
        saveStoredMessages(finalMessages);

        setStatus('speaking');
        speak(replyContent, settings.voiceName, settings.speechRate, settings.speechPitch, () => {
          setStatus('idle');
        });
      }, 1000);
    },
    [messages, settings, speak]
  );

  const { listening, startListening } = useSpeechRecognition((transcript) => {
    handleSendMessage(transcript);
  });

  useEffect(() => {
    if (listening) {
      setStatus('listening');
    } else if (status === 'listening') {
      setStatus('idle');
    }
  }, [listening, status]);

  const handleClearHistory = () => {
    setMessages([]);
    saveStoredMessages([]);
  };

  const handleUpdateSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
  };

  return (
    <main className="flex flex-col h-screen bg-[#0A0A0C] text-slate-100 font-sans overflow-hidden">
      {/* Top Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider uppercase bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Project Jarvis
            </h1>
            <p className="text-[10px] font-mono text-slate-400">Next-Gen Privacy-First PWA</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <AudioVisualizer status={status} />
        </div>
      </header>

      {/* Main Chat Feed */}
      <ChatFeed messages={messages} />

      {/* Floating Dock Controls */}
      <FloatingDock
        onSend={handleSendMessage}
        onToggleListen={startListening}
        listening={listening}
        speaking={speaking}
        onStopSpeech={stop}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onClearHistory={handleClearHistory}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        voices={voices}
      />
    </main>
  );
}
