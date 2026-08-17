"use client";

import { useRef, useState } from "react";
import { Hash, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tag } from "@/types/database";

export function TagInput({
  value,
  onChange,
  suggestions,
  placeholder = "Add tags…",
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions: Tag[];
  placeholder?: string;
}) {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalized = (s: string) => s.toLowerCase().trim();
  const query = input.trim().toLowerCase();

  const available = suggestions.filter(
    (t) =>
      !value.some((v) => normalized(v) === normalized(t.name)) &&
      (!query || normalized(t.name).includes(query)),
  );

  const addTag = (name: string) => {
    const clean = name.trim().replace(/^#/, "");
    if (!clean) return;
    if (value.some((v) => normalized(v) === normalized(clean))) {
      setInput("");
      return;
    }
    onChange([...value, clean]);
    setInput("");
    setHighlight(0);
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (query && available[highlight]) {
        addTag(available[highlight].name);
      } else if (query) {
        addTag(input);
      }
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      removeTag(value.length - 1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, Math.max(available.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Escape") {
      setFocused(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative">
      <div
        className={cn(
          "flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-md border border-border bg-sunken px-2.5 py-2 transition-colors",
          focused && "border-accent/60 ring-2 ring-accent/20",
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center gap-1 rounded-full bg-accent-soft py-1 pl-2.5 pr-1.5 text-[12.5px] font-medium text-accent-strong"
          >
            #{tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(i);
              }}
              aria-label={`Remove tag ${tag}`}
              className="rounded-full p-0.5 transition-colors hover:bg-accent/20"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setHighlight(0);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          aria-label={placeholder}
          className="h-6 min-w-[120px] flex-1 bg-transparent text-sm text-primary placeholder:text-muted focus:outline-none"
        />
      </div>

      {focused && (available.length > 0 || (query && !available.some((t) => normalized(t.name) === query))) && (
        <div
          role="listbox"
          aria-label="Tag suggestions"
          className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-56 overflow-y-auto rounded-lg border border-border-strong bg-elevated py-1.5 shadow-pop"
        >
          {available.map((t, i) => (
            <button
              key={t.id}
              type="button"
              role="option"
              aria-selected={i === highlight}
              onMouseDown={(e) => {
                e.preventDefault();
                addTag(t.name);
              }}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px]",
                i === highlight ? "bg-hover text-primary" : "text-secondary",
              )}
            >
              <Hash className="h-3.5 w-3.5 text-muted" />
              <span className="flex-1">{t.name}</span>
              {t.is_pinned && <span className="text-[10px] text-muted">pinned</span>}
            </button>
          ))}
          {query && !available.some((t) => normalized(t.name) === query) && (
            <button
              type="button"
              role="option"
              aria-selected={highlight >= available.length}
              onMouseDown={(e) => {
                e.preventDefault();
                addTag(query);
              }}
              className={cn(
                "flex w-full items-center gap-2.5 border-t border-border px-3 py-2 text-left text-[13px]",
                highlight >= available.length ? "bg-hover text-accent-strong" : "text-accent-strong",
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>
                Create <span className="font-medium">#{query}</span>
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}