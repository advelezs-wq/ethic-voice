"use client";

import { cn } from "@heroui/react";
import React, { useState, useEffect, useRef } from "react";

interface MentionAutocompleteProps {
  value: string;
  onSelectMention: (mention: { userId: string; userName: string }) => void;
  className?: string;
}

export function MentionAutocomplete({
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

  //   const { user } = useUser();
  //   const { userMemberships } = useOrganizationList({
  //     userMemberships: { infinite: true },
  //   });

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

    // Get organization members (mock data - replace with actual API call)
    const mockUsers = [
      { userId: "user_1", userName: "John Doe" },
      { userId: "user_2", userName: "Jane Smith" },
      { userId: "user_3", userName: "Mike Johnson" },
      { userId: "user_4", userName: "Sarah Williams" },
      { userId: "user_5", userName: "Tom Brown" },
    ];

    const filtered = mockUsers.filter((user) =>
      user.userName.toLowerCase().includes(searchTerm)
    );

    setSuggestions(filtered);
    setSelectedIndex(0);
  }, [searchTerm, showSuggestions]);

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
            "w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center gap-2",
            index === selectedIndex && "bg-gray-100"
          )}
        >
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium">
            {suggestion.userName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm">{suggestion.userName}</span>
        </button>
      ))}
    </div>
  );
}
