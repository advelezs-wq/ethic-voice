/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { revalidatePath } from "next/cache";
import { notificationsService } from "@/modules/app/services/notifications.service";
import { Prisma } from "@prisma/client";
import { pusherServer } from "@/modules/app/lib/pusher";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface ChatMessage {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  authorName: string;
  authorEmail?: string;
  authorAvatarUrl?: string;
  isInternal: boolean;
  isEdited: boolean;
  parentId?: number;
  mentions?: Array<{ userId: string; userName: string }>;
  attachments: Array<{
    id: number;
    filename: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }>;
  reactions: Array<{
    emoji: string;
    count: number;
    hasReacted: boolean;
    users: Array<{ userId: string; userName: string }>;
  }>;
  replies?: ChatMessage[];
  readBy: Array<{ userId: string; userName: string; readAt: string; avatarUrl?: string }>;
}

export async function getReportMessages(
  reportId: number,
  options?: {
    includeInternal?: boolean;
    parentId?: number | null;
    limit?: number;
    cursor?: number;
  }
): Promise<{ messages: ChatMessage[]; hasMore: boolean }> {
  const { userId } = await auth();
  const orgId = await (await import("@/modules/core/utils/org-resolver")).resolveOrgId();

  if (!userId || !orgId) {
    throw new Error("No autorizado");
  }

  const {
    includeInternal = true,
    parentId = null,
    limit = 50,
    cursor,
  } = options || {};

  const where: Prisma.ReportCommentWhereInput = {
    submissionId: reportId,
    submission: { orgId },
    parentId: parentId,
  };

  if (!includeInternal) {
    where.isInternal = false;
  }

  if (cursor) {
    where.id = { lt: cursor };
  }

  const messages = await prisma.reportComment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    include: {
      attachments: true,
      reactions: true,
      readBy: true,
      replies: {
        include: {
          attachments: true,
          reactions: true,
          readBy: true,
        },
        orderBy: { createdAt: "asc" },
        take: 3,
      },
    },
  });

  // Resolve avatar URLs for authors and readers (batch via Clerk)
  const { clerkClient } = await import("@clerk/nextjs/server");
  const userIds = new Set<string>();
  messages.forEach((m) => {
    userIds.add(m.authorId);
    m.readBy.forEach((r) => userIds.add(r.userId));
    m.replies?.forEach((r) => {
      userIds.add(r.authorId);
      r.readBy.forEach((rb) => userIds.add(rb.userId));
    });
  });
  let idToImage: Record<string, string | undefined> = {};
  try {
    const cc = typeof clerkClient === "function" ? await clerkClient() : (clerkClient as any);
    const list = await cc.users.getUserList({ userId: Array.from(userIds) });
    const usersArray = Array.isArray(list) ? list : list?.data || [];
    idToImage = Object.fromEntries(usersArray.map((u: any) => [u.id, u.imageUrl]));
  } catch {}

  const hasMore = messages.length > limit;
  if (hasMore) {
    messages.pop();
  }

  const processedMessages: ChatMessage[] = messages.map((message) => ({
    id: message.id,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    updatedAt: message.updatedAt.toISOString(),
    authorId: message.authorId,
    authorName: message.authorName,
    authorEmail: message.authorEmail || undefined,
    authorAvatarUrl: idToImage[message.authorId],
    isInternal: message.isInternal,
    isEdited: message.isEdited,
    parentId: message.parentId || undefined,
    mentions:
      (message.mentions as Array<{ userId: string; userName: string }>) || [],
    attachments: message.attachments.map((att) => ({
      id: att.id,
      filename: att.filename,
      fileUrl: att.fileUrl,
      fileSize: att.fileSize,
      mimeType: att.mimeType,
    })),
    reactions: processReactions(message.reactions, userId),
    readBy: message.readBy.map((r) => ({
      userId: r.userId,
      userName: r.userName,
      readAt: r.readAt.toISOString(),
      avatarUrl: idToImage[r.userId],
    })),
    replies: message.replies?.map((reply) => ({
      id: reply.id,
      content: reply.content,
      createdAt: reply.createdAt.toISOString(),
      updatedAt: reply.updatedAt.toISOString(),
      authorId: reply.authorId,
      authorName: reply.authorName,
      authorEmail: reply.authorEmail || undefined,
      authorAvatarUrl: idToImage[reply.authorId],
      isInternal: reply.isInternal,
      isEdited: reply.isEdited,
      parentId: reply.parentId || undefined,
      mentions:
        (reply.mentions as Array<{ userId: string; userName: string }>) || [],
      attachments: reply.attachments.map((att) => ({
        id: att.id,
        filename: att.filename,
        fileUrl: att.fileUrl,
        fileSize: att.fileSize,
        mimeType: att.mimeType,
      })),
      reactions: processReactions(reply.reactions, userId),
      readBy: reply.readBy.map((r) => ({
        userId: r.userId,
        userName: r.userName,
        readAt: r.readAt.toISOString(),
        avatarUrl: idToImage[r.userId],
      })),
    })),
  }));

  return {
    messages: processedMessages.reverse(),
    hasMore,
  };
}

export async function sendMessage(
  reportId: number,
  content: string,
  options?: {
    isInternal?: boolean;
    parentId?: number;
    mentions?: Array<{ userId: string; userName: string }>;
    attachmentIds?: number[];
  }
): Promise<ChatMessage> {
  const { userId } = await auth();
  const orgId = await (await import("@/modules/core/utils/org-resolver")).resolveOrgId();
  const user = await currentUser();

  if (!userId || !orgId || !user) {
    throw new Error("No autorizado");
  }

  const report = await prisma.formSubmission.findFirst({
    where: { id: reportId, orgId },
  });

  if (!report) {
    throw new Error("Report not found");
  }

  // Prevent sending messages to archived reports
  if (report.status === "ARCHIVED") {
    throw new Error("Cannot send messages to archived reports");
  }

  const message = await prisma.$transaction(async (tx) => {
    const newMessage = await tx.reportComment.create({
      data: {
        submissionId: reportId,
        content,
        authorId: userId,
        authorName: user.fullName || "Unknown User",
        authorEmail: user.emailAddresses[0]?.emailAddress,
        isInternal: options?.isInternal || false,
        parentId: options?.parentId,
        mentions: options?.mentions || [],
      },
      include: {
        attachments: true,
        reactions: true,
        readBy: true,
      },
    });

    // Update attachments with the new message ID
    if (options?.attachmentIds && options.attachmentIds.length > 0) {
      await tx.commentAttachment.updateMany({
        where: {
          id: { in: options.attachmentIds },
          commentId: null, // Only update orphaned attachments
        },
        data: { commentId: newMessage.id },
      });

      // Fetch the updated message with attachments
      return await tx.reportComment.findUnique({
        where: { id: newMessage.id },
        include: {
          attachments: true,
          reactions: true,
          readBy: true,
        },
      });
    }

    await tx.reportActivity.create({
      data: {
        submissionId: reportId,
        action: "COMMENT_ADDED",
        details: {
          commentId: newMessage.id,
          isInternal: options?.isInternal || false,
          hasAttachments:
            options?.attachmentIds && options.attachmentIds.length > 0,
          isReply: !!options?.parentId,
        },
        userId,
        userName: user.fullName || "Unknown User",
      },
    });

    return newMessage;
  });

  // Send real-time update with full message including attachments
  const fullMessage: ChatMessage = {
    id: message!.id,
    content: message!.content,
    createdAt: message!.createdAt.toISOString(),
    updatedAt: message!.updatedAt.toISOString(),
    authorId: message!.authorId,
    authorName: message!.authorName,
    authorEmail: message!.authorEmail || undefined,
    authorAvatarUrl: user.imageUrl || undefined,
    isInternal: message!.isInternal,
    isEdited: message!.isEdited,
    parentId: message!.parentId || undefined,
    mentions:
      (message!.mentions as Array<{ userId: string; userName: string }>) || [],
    attachments: message!.attachments.map((att) => ({
      id: att.id,
      filename: att.filename,
      fileUrl: att.fileUrl,
      fileSize: att.fileSize,
      mimeType: att.mimeType,
    })),
    reactions: [],
    readBy: [],
  };

  await pusherServer.trigger(`report-${reportId}`, "new-message", {
    message: fullMessage,
  });

  // Send notifications to assigned members about new comment
  try {
    const report = await prisma.formSubmission.findUnique({
      where: { id: reportId },
      select: { orgId: true, assignments: { select: { userId: true } } },
    });

    if (report && report.assignments.length > 0) {
      for (const assignment of report.assignments) {
        // Don't notify the comment author
        if (assignment.userId !== userId) {
          await notificationsService.createNotification({
            userId: assignment.userId,
            orgId: report.orgId,
            type: "REPORT_COMMENT_ADDED",
            title: "Nuevo Comentario",
            message: `${user.fullName || "Un usuario"} agregó un comentario al reporte REP-${String(reportId).padStart(6, "0")}`,
            actionUrl: `/app/reports/${reportId}`,
            reportId,
            channel: "IN_APP",
            metadata: {
              commentAuthor: user.fullName || "Usuario",
              commentPreview: content.substring(0, 100),
              reportTitle: `REP-${String(reportId).padStart(6, "0")}`,
              isInternal: options?.isInternal || false,
            },
          });
        }
      }
    }
  } catch (notificationError) {
    console.error("Error sending comment notifications:", notificationError);
    // Don't fail the comment creation if notifications fail
  }

  revalidatePath(`/app/reports/${reportId}`);

  return fullMessage;
}

export async function editMessage(
  messageId: number,
  content: string
): Promise<ChatMessage> {
  const { userId } = await auth();
  const orgId = await (await import("@/modules/core/utils/org-resolver")).resolveOrgId();

  if (!userId || !orgId) {
    throw new Error("Unauthorized");
  }

  const message = await prisma.reportComment.findFirst({
    where: {
      id: messageId,
      authorId: userId,
      submission: { orgId },
    },
  });

  if (!message) {
    throw new Error("Message not found or unauthorized");
  }

  const updatedMessage = await prisma.reportComment.update({
    where: { id: messageId },
    data: {
      content,
      isEdited: true,
      updatedAt: new Date(),
    },
    include: {
      attachments: true,
      reactions: true,
      readBy: true,
    },
  });

  // Send real-time update
  await pusherServer.trigger(
    `report-${message.submissionId}`,
    "message-updated",
    {
      messageId,
      content,
      updatedAt: updatedMessage.updatedAt.toISOString(),
    }
  );

  revalidatePath(`/app/reports/${message.submissionId}`);

  return {
    id: updatedMessage.id,
    content: updatedMessage.content,
    createdAt: updatedMessage.createdAt.toISOString(),
    updatedAt: updatedMessage.updatedAt.toISOString(),
    authorId: updatedMessage.authorId,
    authorName: updatedMessage.authorName,
    authorEmail: updatedMessage.authorEmail || undefined, // Convert null to undefined
    isInternal: updatedMessage.isInternal,
    isEdited: updatedMessage.isEdited,
    parentId: updatedMessage.parentId || undefined,
    mentions:
      (updatedMessage.mentions as Array<{
        userId: string;
        userName: string;
      }>) || [],
    attachments: updatedMessage.attachments.map((att) => ({
      id: att.id,
      filename: att.filename,
      fileUrl: att.fileUrl,
      fileSize: att.fileSize,
      mimeType: att.mimeType,
    })),
    reactions: processReactions(updatedMessage.reactions, userId),
    readBy: updatedMessage.readBy.map((r) => ({
      userId: r.userId,
      userName: r.userName,
      readAt: r.readAt.toISOString(),
    })),
  };
}

export async function deleteMessage(messageId: number): Promise<void> {
  const { userId } = await auth();
  const orgId = await (await import("@/modules/core/utils/org-resolver")).resolveOrgId();

  if (!userId || !orgId) {
    throw new Error("Unauthorized");
  }

  const message = await prisma.reportComment.findFirst({
    where: {
      id: messageId,
      authorId: userId,
      submission: { orgId },
    },
  });

  if (!message) {
    throw new Error("Message not found or unauthorized");
  }

  await prisma.reportComment.delete({
    where: { id: messageId },
  });

  // Send real-time update
  await pusherServer.trigger(
    `report-${message.submissionId}`,
    "message-deleted",
    { messageId }
  );

  revalidatePath(`/app/reports/${message.submissionId}`);
}

export async function toggleReaction(
  messageId: number,
  emoji: string
): Promise<void> {
  const { userId } = await auth();
  const orgId = await (await import("@/modules/core/utils/org-resolver")).resolveOrgId();
  const user = await currentUser();

  if (!userId || !orgId || !user) {
    throw new Error("Unauthorized");
  }

  const message = await prisma.reportComment.findFirst({
    where: {
      id: messageId,
      submission: { orgId },
    },
  });

  if (!message) {
    throw new Error("Message not found");
  }

  const existingReaction = await prisma.commentReaction.findUnique({
    where: {
      commentId_userId_emoji: {
        commentId: messageId,
        userId,
        emoji,
      },
    },
  });

  if (existingReaction) {
    await prisma.commentReaction.delete({
      where: { id: existingReaction.id },
    });
  } else {
    await prisma.commentReaction.create({
      data: {
        commentId: messageId,
        userId,
        userName: user.fullName || "Unknown User",
        emoji,
      },
    });
  }

  // Send real-time update
  await pusherServer.trigger(
    `report-${message.submissionId}`,
    "reaction-toggled",
    { messageId, emoji, userId }
  );

  revalidatePath(`/app/reports/${message.submissionId}`);
}

export async function markAsRead(messageIds: number[]): Promise<void> {
  const { userId } = await auth();
  const orgId = await (await import("@/modules/core/utils/org-resolver")).resolveOrgId();
  const user = await currentUser();

  if (!userId || !orgId || !user) {
    throw new Error("Unauthorized");
  }

  const messages = await prisma.reportComment.findMany({
    where: {
      id: { in: messageIds },
      submission: { orgId },
    },
  });

  if (messages.length === 0) {
    return;
  }

  const readReceipts = messages.map((message) => ({
    commentId: message.id,
    userId,
    userName: user.fullName || "Unknown User",
  }));

  await prisma.commentReadReceipt.createMany({
    data: readReceipts,
    skipDuplicates: true,
  });

  // Send real-time update for each report
  const reportIds = [...new Set(messages.map((m) => m.submissionId))];
  for (const reportId of reportIds) {
    await pusherServer.trigger(`report-${reportId}`, "messages-read", {
      messageIds,
      userId,
    });
  }
}

export async function uploadAttachment(formData: FormData): Promise<{
  id: number;
  filename: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}> {
  const { userId } = await auth();
  const orgId = await (await import("@/modules/core/utils/org-resolver")).resolveOrgId();

  if (!userId || !orgId) {
    throw new Error("Unauthorized");
  }

  const file = formData.get("file") as File;
  if (!file) {
    throw new Error("No file provided");
  }

  // Convert file to base64
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = buffer.toString("base64");
  const dataURI = `data:${file.type};base64,${base64}`;

  // Upload to Cloudinary
  const uploadResponse = await cloudinary.uploader.upload(dataURI, {
    folder: `reports/${orgId}`,
    resource_type: "auto",
    max_file_size: 10000000, // 10MB
  });

  // Save to database with null commentId - will be updated when message is sent
  const attachment = await prisma.commentAttachment.create({
    data: {
      commentId: null as any, // Temporarily null, will be updated when message is sent
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

// Helper functions
function processReactions(
  reactions: any[],
  currentUserId: string
): ChatMessage["reactions"] {
  const reactionMap = new Map<
    string,
    {
      count: number;
      hasReacted: boolean;
      users: Array<{ userId: string; userName: string }>;
    }
  >();

  reactions.forEach((reaction) => {
    const existing = reactionMap.get(reaction.emoji) || {
      count: 0,
      hasReacted: false,
      users: [],
    };

    existing.count++;
    existing.users.push({
      userId: reaction.userId,
      userName: reaction.userName,
    });

    if (reaction.userId === currentUserId) {
      existing.hasReacted = true;
    }

    reactionMap.set(reaction.emoji, existing);
  });

  return Array.from(reactionMap.entries()).map(([emoji, data]) => ({
    emoji,
    ...data,
  }));
}
