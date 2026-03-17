"use client";

import { cn } from "@heroui/react";
import React, { useEffect, useRef } from "react";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  className?: string;
}

const EMOJI_CATEGORIES = {
  smileys: [
    "😀",
    "😃",
    "😄",
    "😁",
    "😅",
    "😂",
    "🤣",
    "😊",
    "😇",
    "🙂",
    "😉",
    "😌",
    "😍",
    "🥰",
    "😘",
  ],
  gestures: [
    "👍",
    "👎",
    "👌",
    "✌️",
    "🤞",
    "🤟",
    "🤘",
    "🤙",
    "👏",
    "🙌",
    "👐",
    "🤲",
    "🙏",
    "✊",
    "👊",
  ],
  hearts: [
    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🖤",
    "🤍",
    "🤎",
    "💔",
    "❣️",
    "💕",
    "💞",
    "💓",
    "💗",
  ],
  objects: [
    "🎉",
    "🎊",
    "🎈",
    "🎁",
    "🏆",
    "🥇",
    "🥈",
    "🥉",
    "⚡",
    "🔥",
    "💡",
    "⭐",
    "✨",
    "💫",
    "🌟",
  ],
  symbols: [
    "✅",
    "❌",
    "⚠️",
    "📌",
    "🔴",
    "🟠",
    "🟡",
    "🟢",
    "🔵",
    "🟣",
    "⚫",
    "⚪",
    "🟤",
    "🔺",
    "🔻",
  ],
};

export function EmojiPicker({
  onSelect,
  onClose,
  className,
}: EmojiPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute bottom-full left-0 mb-2 w-80 bg-white rounded-lg shadow-lg border p-2 z-50",
        className
      )}
    >
      <div className="max-h-64 overflow-y-auto">
        {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
          <div key={category} className="mb-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1 px-1">
              {category}
            </h3>
            <div className="grid grid-cols-8 gap-1">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onSelect(emoji);
                    onClose();
                  }}
                  className="p-2 hover:bg-gray-100 rounded transition-colors text-lg"
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
