"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";
import { AIProvider, ModelOption, AVAILABLE_MODELS } from "@/types";

interface ModelSelectorProps {
  selectedModel: string;
  selectedProvider: AIProvider;
  onSelectModel: (modelId: string, provider: AIProvider) => void;
  compact?: boolean;
}

const PROVIDER_LABELS: Record<AIProvider, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google AI",
};

const PROVIDER_COLORS: Record<AIProvider, string> = {
  openai: "text-vermillion",
  anthropic: "text-ink-muted",
  google: "text-ochre",
};

export default function ModelSelector({
  selectedModel,
  selectedProvider,
  onSelectModel,
  compact = false,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedModelData = AVAILABLE_MODELS.find((m) => m.id === selectedModel);

  const groupedModels = AVAILABLE_MODELS.reduce(
    (acc, model) => {
      if (!acc[model.provider]) acc[model.provider] = [];
      acc[model.provider].push(model);
      return acc;
    },
    {} as Record<AIProvider, ModelOption[]>
  );

  const filteredModels = search
    ? AVAILABLE_MODELS.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.description.toLowerCase().includes(search.toLowerCase())
      )
    : null;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (model: ModelOption) => {
    onSelectModel(model.id, model.provider);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-lg border border-ink-wash bg-ink-wash hover:bg-ink-wash-strong transition-colors ${
          compact ? "px-2 py-1.5 text-[11px]" : "px-3 py-2 text-xs"
        }`}
      >
        <span className={`font-mono ${PROVIDER_COLORS[selectedProvider]}`}>
          {selectedModelData?.name || selectedModel}
        </span>
        <ChevronDown
          size={12}
          className={`text-ink-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-72 ink-wash-elevated rounded-xl overflow-hidden animate-fade-in z-50">
          <div className="p-2 border-b border-ink-wash">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search models..."
                className="w-full pl-9 pr-3 py-2 bg-paper-inset border border-ink-wash rounded-lg text-xs text-ink-light outline-none focus:border-ink-light placeholder:text-ink-faint"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto p-1">
            {filteredModels ? (
              filteredModels.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-ink-muted">No models found</div>
              ) : (
                filteredModels.map((model) => (
                  <ModelRow key={model.id} model={model} selected={model.id === selectedModel} onSelect={handleSelect} />
                ))
              )
            ) : (
              (Object.keys(groupedModels) as AIProvider[]).map((provider) => (
                <div key={provider}>
                  <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-ink-faint">
                    {PROVIDER_LABELS[provider]}
                  </div>
                  {groupedModels[provider].map((model) => (
                    <ModelRow key={model.id} model={model} selected={model.id === selectedModel} onSelect={handleSelect} />
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ModelRow({
  model,
  selected,
  onSelect,
}: {
  model: ModelOption;
  selected: boolean;
  onSelect: (model: ModelOption) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(model)}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
        selected ? "bg-vermillion-dim border border-vermillion/20" : "hover:bg-ink-wash border border-transparent"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-ink-light">{model.name}</span>
          {selected && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-vermillion-dim text-vermillion">
              Active
            </span>
          )}
        </div>
        <p className="text-[10px] text-ink-muted truncate">{model.description}</p>
      </div>
    </button>
  );
}
