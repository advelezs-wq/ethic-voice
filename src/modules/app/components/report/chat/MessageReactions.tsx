"use client";

import React, { useState } from "react";
import { EmojiPicker } from "./EmojiPicker";
import { cn } from "@heroui/react";

interface MessageReactionsProps {
  reactions: Array<{
    emoji: string;
    count: number;
    hasReacted: boolean;
    users: Array<{ userId: string; userName: string }>;
  }>;
  onToggleReaction: (emoji: string) => void;
}

export function MessageReactions({
  reactions,
  onToggleReaction,
}: MessageReactionsProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  if (reactions.length === 0 && !showEmojiPicker) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 mt-1">
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => onToggleReaction(reaction.emoji)}
          onMouseEnter={() => setShowTooltip(reaction.emoji)}
          onMouseLeave={() => setShowTooltip(null)}
          className={cn(
            "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors relative",
            reaction.hasReacted
              ? "bg-sky-100 text-sky-700 hover:bg-sky-200"
              : "bg-emerald-50 text-slate-600 hover:bg-emerald-100"
          )}
        >
          <span>{reaction.emoji}</span>
          <span className="font-medium">{reaction.count}</span>

          {showTooltip === reaction.emoji && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#0d212c] text-white text-xs rounded whitespace-nowrap z-10">
              {reaction.users
                .slice(0, 3)
                .map((u) => u.userName)
                .join(", ")}
              {reaction.users.length > 3 &&
                ` +${reaction.users.length - 3} más`}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                <div className="border-4 border-transparent border-t-gray-900" />
              </div>
            </div>
          )}
        </button>
      ))}

      <div className="relative">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-1 text-slate-400 hover:text-slate-500 hover:bg-emerald-50 rounded transition-colors"
          title="Añadir reacción"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </button>

        {showEmojiPicker && (
          <EmojiPicker
            onSelect={onToggleReaction}
            onClose={() => setShowEmojiPicker(false)}
            className="bottom-full left-0"
          />
        )}
      </div>
    </div>
  );
}
