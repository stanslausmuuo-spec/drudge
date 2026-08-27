"use client";

import React, { useEffect, useRef } from "react";
import { Message } from "@/types";

interface ChatFeedProps {
  messages: Message[];
}

export default function ChatFeed({ messages }: ChatFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3 max-w-3xl mx-auto w-full">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-3 select-none">
          <div className="w-16 h-16 rounded-full glass flex items-center justify-center mb-2">
            <span className="text-2xl font-light text-blue-400/60 font-mono">
              J
            </span>
          </div>
          <h2 className="text-lg font-medium text-slate-300">Jarvis</h2>
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
            Voice-enabled personal assistant. Connect to start a conversation.
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-pulse-subtle" />
            awaiting connection
          </div>
        </div>
      ) : (
        messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
          >
            <div
              className={`max-w-lg rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-500/10 text-slate-200 rounded-br-sm border border-blue-500/10"
                  : msg.role === "system"
                  ? "bg-transparent text-slate-500 text-xs font-mono text-center w-full"
                  : "glass text-slate-200 rounded-bl-sm"
              }`}
            >
              {msg.role !== "system" && (
                <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-slate-500 mb-1.5">
                  {msg.role === "user" ? "You" : "Jarvis"}
                </div>
              )}
              <div className="whitespace-pre-wrap">{msg.content}</div>
              <div className="text-[9px] font-mono text-slate-600 mt-1.5">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
}
