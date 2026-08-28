"use client";

import React, { useEffect, useState } from "react";

interface KineticTextProps {
  text: string;
  speed?: "slow" | "normal" | "fast";
  className?: string;
}

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeContent = "";
  let lineIndex = 0;

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${lineIndex}`}
            className="bg-paper-inset border border-ink-wash rounded p-3 my-2 overflow-x-auto"
          >
            <code className="text-xs font-mono text-ink-light">{codeContent.trim()}</code>
          </pre>
        );
        codeContent = "";
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      lineIndex++;
      continue;
    }

    if (inCodeBlock) {
      codeContent += line + "\n";
      lineIndex++;
      continue;
    }

    // Headers
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={lineIndex} className="font-serif text-lg font-medium text-ink mt-4 mb-1">
          {line.slice(4)}
        </h3>
      );
      lineIndex++;
      continue;
    }

    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={lineIndex} className="font-serif text-xl font-medium text-ink mt-5 mb-2">
          {line.slice(3)}
        </h2>
      );
      lineIndex++;
      continue;
    }

    // Lists
    if (line.match(/^[-*]\s/)) {
      elements.push(
        <div key={lineIndex} className="flex items-start gap-2 ml-2 my-0.5">
          <span className="text-vermillion mt-0.5 font-serif">—</span>
          <span className="text-sm text-ink-light">{line.replace(/^[-*]\s/, "")}</span>
        </div>
      );
      lineIndex++;
      continue;
    }

    // Numbered lists
    const numberedMatch = line.match(/^(\d+)\.\s(.*)/);
    if (numberedMatch) {
      elements.push(
        <div key={lineIndex} className="flex items-start gap-2 ml-2 my-0.5">
          <span className="font-mono text-xs text-ink-muted mt-0.5">{numberedMatch[1]}.</span>
          <span className="text-sm text-ink-light">{numberedMatch[2]}</span>
        </div>
      );
      lineIndex++;
      continue;
    }

    // Empty lines
    if (line.trim() === "") {
      elements.push(<div key={lineIndex} className="h-2" />);
      lineIndex++;
      continue;
    }

    // Regular paragraphs
    elements.push(
      <p key={lineIndex} className="text-[15px] text-ink leading-relaxed my-1">
        {line}
      </p>
    );
    lineIndex++;
  }

  return elements;
}

export default function KineticText({ text, speed = "normal", className = "" }: KineticTextProps) {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const lines = text.split("\n");
  const totalLines = lines.length;

  const delay = speed === "slow" ? 80 : speed === "fast" ? 20 : 40;

  useEffect(() => {
    setVisibleLines(0);
    let current = 0;
    const timer = setInterval(() => {
      current++;
      setVisibleLines(current);
      if (current >= totalLines) {
        clearInterval(timer);
      }
    }, delay);
    return () => clearInterval(timer);
  }, [text, totalLines, delay]);

  const truncatedText = lines.slice(0, visibleLines).join("\n");

  return (
    <div className={`animate-ink-settle ${className}`}>
      {renderMarkdown(truncatedText)}
    </div>
  );
}
