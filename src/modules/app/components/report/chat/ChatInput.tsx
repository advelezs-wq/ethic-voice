"use client";

import React, { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { EmojiPicker } from "./EmojiPicker";
import { MentionAutocomplete } from "./MentionAutocomplete";
import { uploadAttachment } from "@/actions/chat.actions";
import { cn } from "@heroui/react";
import { useDebounce } from "@/modules/app/hooks/useDebounce";

interface ChatInputProps {
  reportId: number;
  onSendMessage: (
    content: string,
    options?: {
      isInternal?: boolean;
      parentId?: number;
      mentions?: Array<{ userId: string; userName: string }>;
      attachmentIds?: number[];
    }
  ) => Promise<void>;
  onTyping: () => void;
  disabled?: boolean;
  isReportClosed?: boolean;
}

export function ChatInput({ 
  onSendMessage, 
  onTyping, 
  disabled = false, 
  isReportClosed = false 
}: ChatInputProps) {
  const { user } = useUser();
  const [message, setMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadedAttachmentIds, setUploadedAttachmentIds] = useState<number[]>(
    []
  );
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyToId, setReplyToId] = useState<number | null>(null);
  const [mentions, setMentions] = useState<
    Array<{ userId: string; userName: string }>
  >([]);
  const [isUploading, setIsUploading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isInputDisabled = disabled || isReportClosed;

  const debouncedMessage = useDebounce(message, 500);
  useEffect(() => {
    if (debouncedMessage.trim() && user && !isInputDisabled) {
      onTyping();
    }
  }, [debouncedMessage, onTyping, user, isInputDisabled]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (isInputDisabled) return;
    if (
      !message.trim() &&
      uploadedAttachmentIds.length === 0 &&
      attachments.length === 0
    )
      return;
    if (isSending) return;

    setIsSending(true);
    try {
      let allAttachmentIds = [...uploadedAttachmentIds];

      // Upload any pending attachments
      if (attachments.length > 0) {
        setIsUploading(true);
        const uploadPromises = attachments.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          return uploadAttachment(formData);
        });

        const newUploads = await Promise.all(uploadPromises);
        allAttachmentIds = [
          ...allAttachmentIds,
          ...newUploads.map((a) => a.id),
        ];
        setIsUploading(false);
      }

      await onSendMessage(message.trim(), {
        isInternal,
        parentId: replyToId || undefined,
        mentions: mentions.length > 0 ? mentions : undefined,
        attachmentIds:
          allAttachmentIds.length > 0 ? allAttachmentIds : undefined,
      });

      // Reset form
      setMessage("");
      setAttachments([]);
      setUploadedAttachmentIds([]);
      setReplyToId(null);
      setMentions([]);
      setIsInternal(false);

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setIsUploading(false);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isInputDisabled) return;
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);

    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    if (isInputDisabled) return;
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isInputDisabled) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isInputDisabled) return;
    setMessage(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const insertEmoji = (emoji: string) => {
    if (isInputDisabled) return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newMessage =
      message.substring(0, start) + emoji + message.substring(end);

    setMessage(newMessage);
    setShowEmojiPicker(false);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  // Show read-only message if report is closed
  if (isReportClosed) {
    return (
      <div className="border-t bg-gray-50 p-4">
        <div className="flex items-center justify-center py-6 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-gray-200 rounded-full">
              <svg
                className="w-6 h-6 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              Chat en Modo Solo Lectura
            </h3>
            <p className="text-sm text-gray-500">
              Este caso ha sido cerrado. Ya no se pueden enviar nuevos mensajes, pero puedes revisar el historial de conversaciones.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border-t bg-gray-50 p-4">
      {replyToId && (
        <div className="flex items-center justify-between mb-2 px-3 py-2 bg-gray-100 rounded-lg text-sm">
          <span className="text-gray-600">Respondiendo a un mensaje</span>
          <button
            type="button"
            onClick={() => setReplyToId(null)}
            className="text-gray-400 hover:text-gray-600"
            disabled={isInputDisabled}
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="mb-2 p-2 bg-white rounded-lg border">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm"
              >
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
                <span className="max-w-[150px] truncate">{file.name}</span>
                <span className="text-xs text-gray-500">
                  ({formatFileSize(file.size)})
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={isInputDisabled || isUploading}
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          {isUploading && (
            <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              Subiendo archivos...
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isInternal}
            onChange={(e) => setIsInternal(e.target.checked)}
            disabled={isInputDisabled}
            className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500 disabled:opacity-50"
          />
          <span className={cn("text-gray-700", isInputDisabled && "opacity-50")}>
            Mensaje interno
          </span>
          <svg
            className={cn("w-4 h-4 text-gray-400", isInputDisabled && "opacity-50")}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </label>
      </div>

      <div className="flex items-end gap-2">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => !isInputDisabled && fileInputRef.current?.click()}
            disabled={isInputDisabled || isUploading || isSending}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={isInputDisabled ? "Chat deshabilitado" : "Adjuntar archivo"}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => !isInputDisabled && setShowEmojiPicker(!showEmojiPicker)}
            disabled={isInputDisabled}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={isInputDisabled ? "Chat deshabilitado" : "Emojis"}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            id="chat-input"
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={
              isInputDisabled
                ? "Chat deshabilitado - caso cerrado"
                : isInternal
                ? "Escribe un mensaje interno..."
                : "Escribe un mensaje..."
            }
            rows={1}
            disabled={isInputDisabled || isSending || isUploading}
            className={cn(
              "w-full px-4 py-3 border rounded-lg resize-none focus:ring-2 focus:border-transparent transition-colors",
              isInternal && !isInputDisabled
                ? "border-yellow-300 focus:ring-yellow-500 bg-yellow-50"
                : "border-gray-300 focus:ring-blue-500",
              (isSending || isUploading || isInputDisabled) && "opacity-50 cursor-not-allowed"
            )}
            style={{ minHeight: "48px", maxHeight: "120px" }}
          />

          {!isInputDisabled && (
            <MentionAutocomplete
              value={message}
              onSelectMention={(mention) => {
                setMentions((prev) => [...prev, mention]);
                const lastAtIndex = message.lastIndexOf("@");
                setMessage(
                  message.substring(0, lastAtIndex) + `@${mention.userName} `
                );
              }}
            />
          )}
        </div>

        <button
          type="submit"
          disabled={
            isInputDisabled ||
            (!message.trim() &&
              attachments.length === 0 &&
              uploadedAttachmentIds.length === 0) ||
            isSending ||
            isUploading
          }
          className={cn(
            "p-3 rounded-lg transition-colors",
            isInternal && !isInputDisabled
              ? "bg-yellow-600 text-white hover:bg-yellow-700 disabled:bg-yellow-300"
              : "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300",
            "disabled:cursor-not-allowed"
          )}
          title={isInputDisabled ? "Chat deshabilitado - caso cerrado" : "Enviar mensaje"}
        >
          {isSending || isUploading ? (
            <svg
              className="w-5 h-5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          )}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        disabled={isInputDisabled}
      />

      {showEmojiPicker && !isInputDisabled && (
        <div className="relative">
          <EmojiPicker
            onSelect={insertEmoji}
            onClose={() => setShowEmojiPicker(false)}
          />
        </div>
      )}
    </form>
  );
}
