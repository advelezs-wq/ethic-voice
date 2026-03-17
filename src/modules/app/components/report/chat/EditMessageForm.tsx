"use client";

import { Button, cn } from "@heroui/react";
import React, { useState, useRef, useEffect } from "react";

interface EditMessageFormProps {
  initialContent: string;
  onSave: (content: string) => void;
  onCancel: () => void;
}

export function EditMessageForm({
  initialContent,
  onSave,
  onCancel,
}: EditMessageFormProps) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(content.length, content.length);

      // Auto-resize
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || content === initialContent) {
      onCancel();
      return;
    }

    setIsSaving(true);
    try {
      await onSave(content.trim());
    } catch (error) {
      console.error("Error saving message:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          e.target.style.height = "auto";
          e.target.style.height = `${e.target.scrollHeight}px`;
        }}
        onKeyDown={handleKeyDown}
        disabled={isSaving}
        className="w-full p-2 bg-transparent border border-blue-500 text-black bg-white rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{ minHeight: "60px" }}
      />
      <div className="flex items-center gap-2 mt-2 text-xs">
        <Button
          type="submit"
          disabled={isSaving || !content.trim() || content === initialContent}
          className={cn(
            "px-3 py-1 rounded font-medium transition-colors",
            "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-black disabled:cursor-not-allowed"
          )}
        >
          {isSaving ? "Guardando..." : "Guardar"}
        </Button>
        <Button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          variant="light"
          className="px-3 py-1 text-black"
        >
          Cancelar
        </Button>
        <span className="text-gray-700 ml-2">
          Escape para cancelar • Enter para guardar
        </span>
      </div>
    </form>
  );
}
