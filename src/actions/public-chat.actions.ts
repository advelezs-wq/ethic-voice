"use server";

import { headers } from "next/headers";
import prisma from "@/modules/prisma/lib/prisma";
import { pusherServer } from "@/modules/app/lib/pusher";
import { notificationsService } from "@/modules/app/services/notifications.service";
import { securityManager } from "@/modules/app/lib/security/rate-limiter";
import {
  sanitizeSubmissionText,
  scanUploadedFile,
  MAX_ATTACHMENT_SIZE_BYTES,
  ALLOWED_ATTACHMENT_MIME_TYPES,
} from "@/lib/security/submission-security";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const REPORTER_AUTHOR_ID = "reporter";

export interface PublicChatMessage {
  id: number;
  content: string;
  createdAt: string;
  authorName: string;
  fromReporter: boolean;
  attachments: Array<{
    id: number;
    filename: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }>;
}

async function getClientIP(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const realIP = h.get("x-real-ip");
  if (forwarded) return forwarded.split(",")[0].trim();
  if (realIP) return realIP;
  return "unknown";
}

function parseTrackingToken(code: string): string | null {
  // "REP-" + the opaque trackingToken (see FormSubmission.trackingToken) —
  // never the sequential id, which is guessable/enumerable platform-wide.
  const match = code.match(/REP-([A-Za-z0-9]{12})/);
  if (!match) return null;
  return match[1].toUpperCase();
}

async function resolveOpenReport(code: string) {
  const token = parseTrackingToken(code);
  if (!token) throw new Error("Código de seguimiento no válido");

  const submission = await prisma.formSubmission.findUnique({
    where: { trackingToken: token },
    select: {
      id: true,
      orgId: true,
      status: true,
      isAnonymous: true,
      reporterName: true,
      reporterEmail: true,
      organization: { select: { name: true } },
    },
  });

  if (!submission) throw new Error("Denuncia no encontrada");
  return submission;
}

function toPublicMessage(message: {
  id: number;
  content: string;
  createdAt: Date;
  authorId: string;
  authorName: string;
  attachments: Array<{
    id: number;
    filename: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }>;
}): PublicChatMessage {
  return {
    id: message.id,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    authorName: message.authorName,
    fromReporter: message.authorId === REPORTER_AUTHOR_ID,
    attachments: message.attachments.map((att) => ({
      id: att.id,
      filename: att.filename,
      fileUrl: att.fileUrl,
      fileSize: att.fileSize,
      mimeType: att.mimeType,
    })),
  };
}

/**
 * Public, unauthenticated read of the non-internal messages on a report,
 * resolved via its tracking code. Mirrors chat.actions.ts's getReportMessages
 * but hard-scoped to isInternal:false — nothing internal ever reaches this path.
 */
export async function getPublicReportMessages(
  code: string
): Promise<{ messages: PublicChatMessage[]; canReply: boolean }> {
  const submission = await resolveOpenReport(code);

  const messages = await prisma.reportComment.findMany({
    where: {
      submissionId: submission.id,
      isInternal: false,
      parentId: null,
    },
    orderBy: { createdAt: "asc" },
    include: { attachments: true },
  });

  return {
    messages: messages.map(toPublicMessage),
    canReply: submission.status !== "CLOSED" && submission.status !== "ARCHIVED",
  };
}

export async function sendPublicReportMessage(
  code: string,
  content: string,
  attachmentIds: number[] = []
): Promise<PublicChatMessage> {
  const ip = await getClientIP();

  const rateLimit = await securityManager.checkRateLimit({
    type: "form",
    identifier: ip,
  });
  if (!rateLimit.allowed) {
    securityManager.logAttack(
      ip,
      "Public Chat Rate Limit",
      rateLimit.reason || "Public reporter reply rate limit exceeded"
    );
    throw new Error(
      "Demasiados mensajes enviados. Por favor espera un momento antes de intentar de nuevo."
    );
  }

  const cleanContent = sanitizeSubmissionText(content, 5000);
  if (!cleanContent) {
    throw new Error("El mensaje no puede estar vacío");
  }

  const submission = await resolveOpenReport(code);
  if (submission.status === "CLOSED" || submission.status === "ARCHIVED") {
    throw new Error("Este caso está cerrado y ya no admite nuevos mensajes");
  }

  const authorName = submission.isAnonymous
    ? "Denunciante"
    : submission.reporterName || "Denunciante";

  const message = await prisma.$transaction(async (tx) => {
    const newMessage = await tx.reportComment.create({
      data: {
        submissionId: submission.id,
        content: cleanContent,
        authorId: REPORTER_AUTHOR_ID,
        authorName,
        authorEmail: submission.isAnonymous ? undefined : submission.reporterEmail || undefined,
        isInternal: false,
      },
      include: { attachments: true },
    });

    if (attachmentIds.length > 0) {
      await tx.commentAttachment.updateMany({
        where: { id: { in: attachmentIds }, commentId: null },
        data: { commentId: newMessage.id },
      });
    }

    // Named so it stays out of the public timeline's "case update" feed
    // (that switch's default branch filters anything containing "comment").
    await tx.reportActivity.create({
      data: {
        submissionId: submission.id,
        action: "REPORTER_COMMENT_ADDED",
        userId: REPORTER_AUTHOR_ID,
        userName: authorName,
        details: {
          commentId: newMessage.id,
          hasAttachments: attachmentIds.length > 0,
        },
      },
    });

    if (attachmentIds.length > 0) {
      return tx.reportComment.findUniqueOrThrow({
        where: { id: newMessage.id },
        include: { attachments: true },
      });
    }

    return newMessage;
  });

  const publicMessage = toPublicMessage(message);

  try {
    await pusherServer.trigger(`report-${submission.id}`, "new-message", {
      message: {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        updatedAt: message.createdAt.toISOString(),
        authorId: REPORTER_AUTHOR_ID,
        authorName,
        isInternal: false,
        isEdited: false,
        mentions: [],
        attachments: publicMessage.attachments,
        reactions: [],
        readBy: [],
        fromReporter: true,
      },
    });
  } catch (err) {
    console.error("[pusher] public chat trigger failed:", err);
  }

  try {
    const assignments = await prisma.reportAssignment.findMany({
      where: { reportId: submission.id },
      select: { userId: true },
    });
    const trackingCode = `REP-${String(submission.id).padStart(6, "0")}`;
    for (const assignment of assignments) {
      await notificationsService.createNotification({
        userId: assignment.userId,
        orgId: submission.orgId,
        type: "REPORT_COMMENT_ADDED",
        title: "Respuesta del denunciante",
        message: `${authorName} respondió en el reporte ${trackingCode}`,
        actionUrl: `/app/reports/${submission.id}`,
        reportId: submission.id,
        channel: "IN_APP",
        metadata: {
          commentAuthor: authorName,
          commentPreview: cleanContent.substring(0, 100),
          reportTitle: trackingCode,
          isInternal: false,
          fromReporter: true,
        },
      });
    }
  } catch (notificationError) {
    console.error("Error notifying team of reporter reply:", notificationError);
  }

  return publicMessage;
}

/**
 * Public file upload for a reporter's chat reply. Reuses the exact same
 * file-signature scan used on the public submission form (scanUploadedFile) —
 * no lighter validation path for this because it's also unauthenticated input.
 */
export async function uploadPublicChatAttachment(
  code: string,
  formData: FormData
): Promise<{
  id: number;
  filename: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}> {
  const ip = await getClientIP();

  const rateLimit = await securityManager.checkRateLimit({
    type: "upload",
    identifier: ip,
  });
  if (!rateLimit.allowed) {
    throw new Error("Demasiados archivos enviados. Intenta de nuevo en un momento.");
  }

  const submission = await resolveOpenReport(code);
  if (submission.status === "CLOSED" || submission.status === "ARCHIVED") {
    throw new Error("Este caso está cerrado y ya no admite nuevos archivos");
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    throw new Error("No se proporcionó ningún archivo");
  }
  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    throw new Error("El archivo supera el tamaño máximo permitido (50MB)");
  }
  if (!ALLOWED_ATTACHMENT_MIME_TYPES.has(file.type)) {
    throw new Error("Tipo de archivo no permitido");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const scan = await scanUploadedFile(buffer, file.name, file.type);
  if (!scan.safe) {
    await securityManager.addQuarantineFile({
      ip,
      organizationId: submission.orgId,
      filename: file.name,
      mimeType: file.type,
      fileSize: file.size,
      sha256: scan.sha256,
      reason: scan.reason || "Failed public chat file scan",
    });
    throw new Error("El archivo no pasó la validación de seguridad");
  }

  const base64 = buffer.toString("base64");
  const dataURI = `data:${file.type};base64,${base64}`;

  const uploadResponse = await cloudinary.uploader.upload(dataURI, {
    folder: `reports/${submission.orgId}`,
    resource_type: "auto",
    max_file_size: MAX_ATTACHMENT_SIZE_BYTES,
  });

  const attachment = await prisma.commentAttachment.create({
    data: {
      commentId: null,
      filename: file.name,
      fileUrl: uploadResponse.secure_url,
      fileSize: file.size,
      mimeType: file.type,
    },
  });

  return {
    id: attachment.id,
    filename: attachment.filename,
    fileUrl: attachment.fileUrl,
    fileSize: attachment.fileSize,
    mimeType: attachment.mimeType,
  };
}
