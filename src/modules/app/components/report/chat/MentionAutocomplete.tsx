"use client";

import { cn } from "@heroui/react";
import React, { useState, useEffect, useRef } from "react";
import { searchMentionCandidates } from "@/actions/chat.actions";

interface MentionAutocompleteProps {
  reportId: number;
  value: string;
  onSelectMention: (mention: { userId: string; userName: string }) => void;
  className?: string;
}

export function MentionAutocomplete({
  reportId,
  value,
  onSelectMention,
  className,
}: MentionAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<
    Array<{ userId: string; userName: string }>
  >([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lastAtIndex = value.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const afterAt = value.substring(lastAtIndex + 1);
      const spaceIndex = afterAt.indexOf(" ");

      if (spaceIndex === -1) {
        setSearchTerm(afterAt.toLowerCase());
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  }, [value]);

  useEffect(() => {
    if (!showSuggestions || !searchTerm) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      try {
        const results = await searchMentionCandidates(reportId, searchTerm);
        if (!cancelled) {
          setSuggestions(results);
          setSelectedIndex(0);
        }
      } catch (error) {
        console.error("Error searching mention candidates:", error);
        if (!cancelled) setSuggestions([]);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [reportId, searchTerm, showSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "Enter":
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          onSelectMention(suggestions[selectedIndex]);
          setShowSuggestions(false);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        break;
    }
  };

  useEffect(() => {
    if (showSuggestions) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSuggestions, suggestions, selectedIndex]);

  if (!showSuggestions || suggestions.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute bottom-full left-0 mb-2 w-64 bg-white rounded-lg shadow-lg border max-h-48 overflow-y-auto",
        className
      )}
    >
      {suggestions.map((suggestion, index) => (
        <button
          key={suggestion.userId}
          onClick={() => {
            onSelectMention(suggestion);
            setShowSuggestions(false);
          }}
          className={cn(
            "w-full px-4 py-2 text-left hover:bg-emerald-50 transition-colors flex items-center gap-2",
            index === selectedIndex && "bg-emerald-50"
          )}
        >
          <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-sm font-medium">
            {suggestion.userName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm">{suggestion.userName}</span>
        </button>
      ))}
    </div>
  );
}
