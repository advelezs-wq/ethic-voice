/* eslint-disable @typescript-eslint/no-explicit-any */
import { google, gmail_v1 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { submissionProcessor } from "./submission-processor.service";
import { SubmissionSource } from "@/types/submission.types";
import prisma from "@/modules/prisma/lib/prisma";
import { v2 as cloudinary } from "cloudinary";

export class EmailProcessorService {
  private gmail: gmail_v1.Gmail;
  private oauth2Client: OAuth2Client;
  private baseEmail: string;

  constructor() {
    this.baseEmail = process.env.REPORTS_EMAIL_BASE || "reports@yourdomain.com";

    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    this.oauth2Client.setCredentials({
      access_token: process.env.GOOGLE_ACCESS_TOKEN,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    this.gmail = google.gmail({ version: "v1", auth: this.oauth2Client });

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  /**
   * Process emails for all active organizations
   */
  async processAllOrganizationsEmails() {
    const activeConfigs = await prisma.emailConfiguration.findMany({
      where: { isActive: true },
      include: { organization: true },
    });

    for (const config of activeConfigs) {
      try {
        await this.processOrganizationEmails(config);
      } catch (error) {
        console.error(
          `Error processing emails for org ${config.orgId}:`,
          error
        );
      }
    }
  }

  /**
   * Process emails for a specific organization
   */
  private async processOrganizationEmails(config: any) {
    const { orgId, emailAlias, subjectKeywords } = config;

    // Build search query
    const aliasEmail = `${this.baseEmail.split("@")[0]}+${emailAlias}@${
      this.baseEmail.split("@")[1]
    }`;
    const query = this.buildSearchQuery(aliasEmail, subjectKeywords);

    console.log(
      `Checking emails for ${config.organization.name} (${aliasEmail})`
    );

    try {
      // Search for unread emails
      const response = await this.gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults: 10,
      });

      if (!response.data.messages || response.data.messages.length === 0) {
        console.log(`No new emails for ${config.organization.name}`);
        return;
      }

      console.log(
        `Found ${response.data.messages.length} emails for ${config.organization.name}`
      );

      // Process each email
      for (const message of response.data.messages) {
        await this.processEmailMessage(message.id!, orgId, config);
      }

      // Update last checked timestamp
      await prisma.emailConfiguration.update({
        where: { id: config.id },
        data: { lastCheckedAt: new Date() },
      });
    } catch (error) {
      console.error(`Error checking emails for ${orgId}:`, error);
      throw error;
    }
  }

  /**
   * Build Gmail search query
   */
  private buildSearchQuery(emailAddress: string, keywords: string[]): string {
    const parts = [`to:${emailAddress}`, "is:unread"];

    if (keywords.length > 0) {
      const keywordQuery = keywords.map((k) => `subject:"${k}"`).join(" OR ");
      parts.push(`(${keywordQuery})`);
    }

    return parts.join(" ");
  }

  /**
   * Process individual email message
   */
  private async processEmailMessage(
    messageId: string,
    orgId: string,
    config: any
  ) {
    try {
      // Get full message
      const message = await this.gmail.users.messages.get({
        userId: "me",
        id: messageId,
        format: "full",
      });

      const emailData = this.parseEmailMessage(message.data);

      // Extract sender info
      const reporterInfo = this.extractReporterInfo(emailData.from);

      // Process attachments if any
      const processedAttachments = emailData.attachments.length > 0 
        ? await this.processEmailAttachments(messageId, emailData.attachments, orgId)
        : [];

      // Process with AI
      const result = await submissionProcessor.processSubmission({
        orgId,
        content: this.formatEmailContent(emailData),
        source: SubmissionSource.EMAIL,
        metadata: {
          emailId: messageId,
          from: emailData.from,
          subject: emailData.subject,
          date: emailData.date,
          hasAttachments: emailData.attachments.length > 0,
          attachmentCount: processedAttachments.length,
        },
        reporterInfo: {
          email: reporterInfo.email,
          name: reporterInfo.name,
          isAnonymous: false,
        },
        attachments: processedAttachments,
      });

      // Mark as read
      await this.gmail.users.messages.modify({
        userId: "me",
        id: messageId,
        requestBody: {
          removeLabelIds: ["UNREAD"],
        },
      });

      // Update email processed count
      await prisma.emailConfiguration.update({
        where: { id: config.id },
        data: { emailsProcessed: { increment: 1 } },
      });

      // Send confirmation email
      if (reporterInfo.email && config.autoProcess) {
        await this.sendConfirmationEmail(
          reporterInfo.email,
          result.trackingCode,
          config.organization.name
        );
      }

      console.log(
        `Email ${messageId} processed successfully. Tracking: ${result.trackingCode}`
      );
    } catch (error) {
      console.error(`Error processing email ${messageId}:`, error);
      // Don't throw - continue with other emails
    }
  }

  /**
   * Parse email message data
   */
  private parseEmailMessage(message: any) {
    const headers = message.payload?.headers || [];
    const getHeader = (name: string) =>
      headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())
        ?.value || "";

    const from = getHeader("From");
    const subject = getHeader("Subject");
    const date = getHeader("Date");

    // Extract body
    const body = this.extractEmailBody(message.payload);

    // Extract attachments
    const attachments = this.extractAttachments(message.payload);

    return {
      id: message.id,
      from,
      subject,
      date,
      body,
      attachments,
    };
  }

  /**
   * Extract email body from payload
   */
  private extractEmailBody(payload: any): string {
    let body = "";

    if (payload.body?.data) {
      body = Buffer.from(payload.body.data, "base64").toString("utf-8");
    } else if (payload.parts) {
      // Look for text/plain first, then text/html
      for (const part of payload.parts) {
        if (part.mimeType === "text/plain" && part.body?.data) {
          body = Buffer.from(part.body.data, "base64").toString("utf-8");
          break;
        }
      }

      // Fallback to HTML if no plain text
      if (!body) {
        for (const part of payload.parts) {
          if (part.mimeType === "text/html" && part.body?.data) {
            const html = Buffer.from(part.body.data, "base64").toString(
              "utf-8"
            );
            // Basic HTML to text conversion
            body = html
              .replace(
                /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
                ""
              )
              .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
              .replace(/<[^>]+>/g, " ")
              .replace(/\s+/g, " ")
              .trim();
            break;
          }
        }
      }
    }

    return body || "No se pudo extraer el contenido del email";
  }

  /**
   * Extract attachments info
   */
  private extractAttachments(payload: any): any[] {
    const attachments: any[] = [];

    const extractFromParts = (parts: any[]) => {
      for (const part of parts || []) {
        if (part.filename && part.body?.attachmentId) {
          attachments.push({
            filename: part.filename,
            mimeType: part.mimeType,
            size: part.body.size,
            attachmentId: part.body.attachmentId,
          });
        }

        // Recursively check nested parts
        if (part.parts) {
          extractFromParts(part.parts);
        }
      }
    };

    if (payload.parts) {
      extractFromParts(payload.parts);
    }

    return attachments;
  }

  /**
   * Extract reporter info from email address
   */
  private extractReporterInfo(fromHeader: string) {
    // Extract email and name from "Name <email@domain.com>" format
    const match = fromHeader.match(/^(.+?)\s*<(.+?)>$/);

    if (match) {
      return {
        name: match[1].replace(/"/g, "").trim(),
        email: match[2].trim(),
      };
    }

    // Just email address
    return {
      name: null,
      email: fromHeader.trim(),
    };
  }

  /**
   * Format email content for processing
   */
  private formatEmailContent(emailData: any): string {
    const parts = [
      `Asunto: ${emailData.subject}`,
      `De: ${emailData.from}`,
      `Fecha: ${emailData.date}`,
      "",
      "Contenido:",
      emailData.body,
    ];

    if (emailData.attachments.length > 0) {
      parts.push("");
      parts.push("Archivos adjuntos:");
      emailData.attachments.forEach((att: any) => {
        parts.push(
          `- ${att.filename} (${att.mimeType}, ${this.formatFileSize(
            att.size
          )})`
        );
      });
    }

    return parts.join("\n");
  }

  /**
   * Format file size
   */
  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  /**
   * Send confirmation email
   */
  private async sendConfirmationEmail(
    to: string,
    trackingCode: string,
    orgName: string
  ) {
    const subject = `Reporte Recibido - ${trackingCode}`;
    const message = [
      `Estimado/a,`,
      "",
      `Hemos recibido su reporte para ${orgName}.`,
      "",
      `Su código de seguimiento es: ${trackingCode}`,
      "",
      `Puede consultar el estado de su reporte en cualquier momento usando este código.`,
      "",
      `Gracias por su colaboración.`,
      "",
      `Atentamente,`,
      `Sistema de Denuncias ${orgName}`,
    ].join("\n");

    const raw = this.createRawEmail(to, subject, message);

    try {
      await this.gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw,
        },
      });
    } catch (error) {
      console.error("Error sending confirmation email:", error);
    }
  }

  /**
   * Process email attachments by downloading from Gmail and uploading to Cloudinary
   */
  private async processEmailAttachments(
    messageId: string,
    attachments: any[],
    orgId: string
  ): Promise<Array<{
    filename: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    cloudinaryPublicId: string;
  }>> {
    const processedAttachments = [];

    for (const attachment of attachments) {
      try {
        // Download attachment from Gmail
        const attachmentData = await this.gmail.users.messages.attachments.get({
          userId: 'me',
          messageId: messageId,
          id: attachment.attachmentId,
        });

        if (!attachmentData.data.data) {
          console.error(`No data found for attachment: ${attachment.filename}`);
          continue;
        }

        // Convert base64 to buffer
        const buffer = Buffer.from(attachmentData.data.data, 'base64');

        // Validate file size (50MB max)
        if (buffer.length > 50 * 1024 * 1024) {
          console.warn(`Attachment ${attachment.filename} too large (${buffer.length} bytes), skipping`);
          continue;
        }

        // Validate file type
        const allowedTypes = [
          'image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'application/pdf',
          'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
          'audio/mpeg', 'audio/wav', 'audio/mp4',
          'video/mp4', 'video/avi', 'video/quicktime', 'video/webm'
        ];

        if (!allowedTypes.includes(attachment.mimeType)) {
          console.warn(`Attachment ${attachment.filename} has unsupported type: ${attachment.mimeType}, skipping`);
          continue;
        }

        // Create data URI for Cloudinary
        const base64Data = buffer.toString('base64');
        const dataURI = `data:${attachment.mimeType};base64,${base64Data}`;

        // Upload to Cloudinary
        const uploadResponse = await cloudinary.uploader.upload(dataURI, {
          folder: `reports/${orgId}/email-attachments`,
          resource_type: 'auto',
          max_file_size: 50000000,
          public_id: `${messageId}_${Date.now()}_${attachment.filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
          allowed_formats: ['jpg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'mp3', 'mp4', 'avi', 'mov', 'xlsx', 'txt', 'wav'],
        });

        processedAttachments.push({
          filename: attachment.filename,
          fileUrl: uploadResponse.secure_url,
          fileSize: buffer.length,
          mimeType: attachment.mimeType,
          cloudinaryPublicId: uploadResponse.public_id,
        });

                  console.log(`[EMAIL] Processed email attachment: ${attachment.filename} (${this.formatFileSize(buffer.length)})`);

      } catch (error) {
        console.error(`❌ Error processing attachment ${attachment.filename}:`, error);
      }
    }

          console.log(`[EMAIL] Processed ${processedAttachments.length}/${attachments.length} email attachments for message ${messageId}`);
    return processedAttachments;
  }

  /**
   * Create raw email for sending
   */
  private createRawEmail(to: string, subject: string, message: string): string {
    const email = [
      `To: ${to}`,
      `Subject: ${subject}`,
      "Content-Type: text/plain; charset=utf-8",
      "",
      message,
    ].join("\n");

    return Buffer.from(email)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  }
}

// Export singleton
export const emailProcessor = new EmailProcessorService();
