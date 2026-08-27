"use client";

import React, { useEffect, useRef } from "react";
import { Message } from "@/types";
import EmptyState from "./EmptyState";

interface ChatFeedProps {
  messages: Message[];
  onQuickAction: (action: string) => void;
  isConnected: boolean;
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeContent = "";
  let codeLanguage = "";

  lines.forEach((line, lineIndex) => {
    // Code blocks
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${lineIndex}`}
            className="bg-black/40 border border-white/5 rounded-lg p-3 my-2 overflow-x-auto"
          >
            <code className="text-xs font-mono text-slate-300">{codeContent.trim()}</code>
          </pre>
        );
        codeContent = "";
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeLanguage = line.slice(3).trim();
      }
      return;
    }

    if (inCodeBlock) {
      codeContent += line + "\n";
      return;
    }

    // Inline formatting
    let processedLine = line;

    // Bold
    processedLine = processedLine.replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="text-slate-100 font-medium">$1</strong>'
    );

    // Italic
    processedLine = processedLine.replace(
      /\*(.*?)\*/g,
      '<em class="text-slate-300">$1</em>'
    );

    // Inline code
    processedLine = processedLine.replace(
      /`(.*?)`/g,
      '<code class="px-1.5 py-0.5 bg-black/30 border border-white/5 rounded text-xs font-mono text-blue-400">$1</code>'
    );

    // Lists
    if (processedLine.match(/^[-*]\s/)) {
      elements.push(
        <div key={lineIndex} className="flex items-start gap-2 ml-2 my-0.5">
          <span className="text-blue-400 mt-0.5">•</span>
          <span
            className="text-sm text-slate-300"
            dangerouslySetInnerHTML={{ __html: processedLine.replace(/^[-*]\s/, "") }}
          />
        </div>
      );
      return;
    }

    // Numbered lists
    if (processedLine.match(/^\d+\.\s/)) {
      const match = processedLine.match(/^(\d+)\.\s(.*)/);
      if (match) {
        elements.push(
          <div key={lineIndex} className="flex items-start gap-2 ml-2 my-0.5">
            <span className="text-blue-400 font-mono text-xs mt-0.5">{match[1]}.</span>
            <span
              className="text-sm text-slate-300"
              dangerouslySetInnerHTML={{ __html: match[2] }}
            />
          </div>
        );
        return;
      }
    }

    // Headers
    if (processedLine.startsWith("### ")) {
      elements.push(
        <h3
          key={lineIndex}
          className="text-sm font-medium text-slate-200 mt-3 mb-1"
          dangerouslySetInnerHTML={{ __html: processedLine.slice(4) }}
        />
      );
      return;
    }

    if (processedLine.startsWith("## ")) {
      elements.push(
        <h2
          key={lineIndex}
          className="text-base font-medium text-slate-200 mt-4 mb-2"
          dangerouslySetInnerHTML={{ __html: processedLine.slice(3) }}
        />
      );
      return;
    }

    if (processedLine.startsWith("# ")) {
      elements.push(
        <h1
          key={lineIndex}
          className="text-lg font-medium text-slate-100 mt-4 mb-2"
          dangerouslySetInnerHTML={{ __html: processedLine.slice(2) }}
        />
      );
      return;
    }

    // Empty lines
    if (line.trim() === "") {
      elements.push(<div key={lineIndex} className="h-2" />);
      return;
    }

    // Regular paragraphs
    elements.push(
      <p
        key={lineIndex}
        className="text-sm text-slate-300 leading-relaxed my-1"
        dangerouslySetInnerHTML={{ __html: processedLine }}
      />
    );
  });

  return <>{elements}</>;
}

export default function ChatFeed({ messages, onQuickAction, isConnected }: ChatFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return <EmptyState onQuickAction={onQuickAction} isConnected={isConnected} />;
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3 max-w-3xl mx-auto w-full">
      {messages.map((msg) => (
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
            <div className="whitespace-pre-wrap">{renderMarkdown(msg.content)}</div>
            <div className="text-[9px] font-mono text-slate-600 mt-1.5">
              {new Date(msg.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
