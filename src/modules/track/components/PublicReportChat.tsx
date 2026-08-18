"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import { addToast } from "@/modules/core/utils/safe-toast";
import { formatFileSize, getAttachmentDownloadUrl } from "@/modules/app/utils/reports";
import { pusherClient } from "@/modules/app/lib/pusher";
import {
  getPublicReportMessages,
  sendPublicReportMessage,
  uploadPublicChatAttachment,
  type PublicChatMessage,
} from "@/actions/public-chat.actions";

interface PublicReportChatProps {
  reportId: number;
  trackingCode: string;
}

const SEEN_KEY_PREFIX = "ev_track_last_seen_msg_";

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PublicReportChat({ reportId, trackingCode }: PublicReportChatProps) {
  const [messages, setMessages] = useState<PublicChatMessage[]>([]);
  const [canReply, setCanReply] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const seenKey = `${SEEN_KEY_PREFIX}${trackingCode}`;

  const markSeen = useCallback(
    (msgs: PublicChatMessage[]) => {
      if (msgs.length === 0) return;
      const lastId = Math.max(...msgs.map((m) => m.id));
      try {
        localStorage.setItem(seenKey, String(lastId));
      } catch {}
      setNewMessageCount(0);
    },
    [seenKey]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        const { messages: loaded, canReply: replyAllowed } =
          await getPublicReportMessages(trackingCode);
        if (cancelled) return;

        let lastSeenId = 0;
        try {
          lastSeenId = parseInt(localStorage.getItem(seenKey) || "0", 10) || 0;
        } catch {}

        const unseenFromTeam = loaded.filter(
          (m) => !m.fromReporter && m.id > lastSeenId
        );

        setMessages(loaded);
        setCanReply(replyAllowed);
        setNewMessageCount(unseenFromTeam.length);
        // Persist "seen" immediately — the banner below keeps showing the
        // count for this visit, but a page refresh shouldn't re-announce
        // messages the reporter is actively looking at right now.
        if (loaded.length > 0) {
          try {
            localStorage.setItem(
              seenKey,
              String(Math.max(...loaded.map((m) => m.id)))
            );
          } catch {}
        }
      } catch (err) {
        console.error("Error loading public chat:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [trackingCode, seenKey]);

  useEffect(() => {
    const channel = pusherClient.subscribe(`report-${reportId}`);

    channel.bind(
      "new-message",
      (data: { message: { isInternal: boolean } & Omit<PublicChatMessage, "fromReporter"> & { authorId?: string; fromReporter?: boolean } }) => {
        if (data.message.isInternal) return;
        const incoming: PublicChatMessage = {
          id: data.message.id,
          content: data.message.content,
          createdAt: data.message.createdAt,
          authorName: data.message.authorName,
          fromReporter: Boolean(data.message.fromReporter),
          attachments: data.message.attachments || [],
        };
        setMessages((prev) => {
          if (prev.some((m) => m.id === incoming.id)) return prev;
          return [...prev, incoming];
        });
        if (!incoming.fromReporter) {
          setNewMessageCount((c) => c + 1);
        }
      }
    );

    return () => {
      pusherClient.unsubscribe(`report-${reportId}`);
    };
  }, [reportId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > 50 * 1024 * 1024) {
      addToast({
        title: "Archivo demasiado grande",
        description: "El tamaño máximo permitido es 50MB",
        color: "danger",
      });
      return;
    }
    setFile(selected);
  };

  const handleSend = async () => {
    if (!content.trim() && !file) return;

    setIsSending(true);
    try {
      let attachmentIds: number[] = [];
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploaded = await uploadPublicChatAttachment(trackingCode, formData);
        attachmentIds = [uploaded.id];
      }

      const sent = await sendPublicReportMessage(
        trackingCode,
        content.trim() || "(archivo adjunto)",
        attachmentIds
      );

      setMessages((prev) =>
        prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]
      );
      setContent("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      addToast({
        title: "No se pudo enviar el mensaje",
        description: err instanceof Error ? err.message : "Intenta de nuevo",
        color: "danger",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col items-start gap-1 pb-2">
        <h3 className="text-lg font-semibold">Mensajes con el equipo</h3>
        <p className="text-xs text-gray-500">
          Aquí puedes ver las respuestas del equipo que gestiona tu caso y
          responder directamente. Esta conversación es confidencial.
        </p>
      </CardHeader>
      <CardBody className="space-y-4">
        {newMessageCount > 0 && (
          <button
            type="button"
            onClick={() => markSeen(messages)}
            className="w-full text-left text-sm font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center gap-2"
          >
            <i
              className="icon-[lucide--message-circle] size-4"
              role="img"
              aria-hidden="true"
            />
            Tienes {newMessageCount}{" "}
            {newMessageCount === 1 ? "mensaje nuevo" : "mensajes nuevos"} del
            equipo
          </button>
        )}

        {isLoading ? (
          <div className="py-8 text-center text-sm text-gray-500">
            Cargando conversación...
          </div>
        ) : messages.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">
            Aún no hay mensajes. Si tienes información adicional, puedes
            escribir aquí.
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.fromReporter ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    m.fromReporter
                      ? "bg-emerald-600 text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-900 rounded-bl-sm"
                  }`}
                >
                  <p
                    className={`text-[11px] font-semibold mb-0.5 ${
                      m.fromReporter ? "text-emerald-100" : "text-gray-500"
                    }`}
                  >
                    {m.fromReporter ? "Tú" : m.authorName}
                  </p>
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {m.content}
                  </p>
                  {m.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {m.attachments.map((att) => (
                        <a
                          key={att.id}
                          href={getAttachmentDownloadUrl(att.fileUrl)}
                          download={att.filename}
                          className={`flex items-center gap-1.5 text-xs underline ${
                            m.fromReporter ? "text-emerald-50" : "text-emerald-700"
                          }`}
                        >
                          <i
                            className="icon-[lucide--paperclip] size-3"
                            role="img"
                            aria-hidden="true"
                          />
                          {att.filename} ({formatFileSize(att.fileSize)})
                        </a>
                      ))}
                    </div>
                  )}
                  <p
                    className={`text-[10px] mt-1 ${
                      m.fromReporter ? "text-emerald-100/80" : "text-gray-400"
                    }`}
                  >
                    {formatTime(m.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && (
          <>
            {canReply ? (
              <div className="border-t pt-3 space-y-2">
                <Textarea
                  value={content}
                  onValueChange={setContent}
                  placeholder="Escribe tu respuesta al equipo..."
                  minRows={2}
                  maxRows={5}
                  isDisabled={isSending}
                />
                {file && (
                  <div className="flex items-center justify-between bg-gray-50 border rounded-lg px-3 py-1.5 text-xs text-gray-600">
                    <span className="truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="text-gray-400 hover:text-gray-700"
                    >
                      <i
                        className="icon-[lucide--x] size-3.5"
                        role="img"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Button
                    variant="light"
                    size="sm"
                    isIconOnly
                    onPress={() => fileInputRef.current?.click()}
                    isDisabled={isSending}
                    aria-label="Adjuntar archivo"
                  >
                    <i
                      className="icon-[lucide--paperclip] size-4"
                      role="img"
                      aria-hidden="true"
                    />
                  </Button>
                  <Button
                    color="primary"
                    size="sm"
                    onPress={handleSend}
                    isLoading={isSending}
                    isDisabled={!content.trim() && !file}
                    className="ml-auto"
                  >
                    Enviar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-t pt-3">
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
                  <i
                    className="icon-[lucide--lock] size-4 shrink-0"
                    role="img"
                    aria-hidden="true"
                  />
                  Este caso está cerrado y ya no admite nuevos mensajes.
                </div>
              </div>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}
