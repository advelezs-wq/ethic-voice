"use client";

import { cn } from "@heroui/react";
import React from "react";

export function ChatLoadingSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {[...Array(5)].map((_, index) => (
        <div
          key={index}
          className={cn(
            "flex items-start gap-3 animate-pulse",
            index % 2 === 1 && "flex-row-reverse"
          )}
        >
          <div className="w-8 h-8 bg-gray-200 rounded-full" />
          <div className="flex-1 max-w-[70%]">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-3 w-16 bg-gray-200 rounded" />
            </div>
            <div
              className={cn(
                "rounded-2xl p-4",
                index % 2 === 1 ? "bg-blue-100" : "bg-gray-100"
              )}
            >
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
