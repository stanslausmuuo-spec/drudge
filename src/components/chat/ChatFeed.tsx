'use client';

import React from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface ChatFeedProps {
  messages: Message[];
}

export default function ChatFeed({ messages }: ChatFeedProps) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-4xl mx-auto w-full">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 space-y-2">
          <h2 className="text-xl font-semibold text-slate-300">Project Jarvis Initialized</h2>
          <p className="text-sm max-w-md">
            Speak or type your command below. Jarvis is ready to assist you with privacy-first execution.
          </p>
        </div>
      ) : (
        messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xl rounded-2xl px-5 py-3.5 text-sm leading-relaxed backdrop-blur-md shadow-lg ${
                msg.role === 'user'
                  ? 'bg-blue-600/90 text-white rounded-br-sm border border-blue-500/40'
                  : 'bg-slate-900/80 text-slate-100 rounded-bl-sm border border-slate-800/80'
              }`}
            >
              <div className="text-[10px] font-mono uppercase tracking-wider opacity-60 mb-1">
                {msg.role === 'user' ? 'You' : 'Jarvis'}
              </div>
              <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
