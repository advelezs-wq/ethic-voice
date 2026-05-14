/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from "@/modules/prisma/lib/prisma";
import { createHash } from "crypto";
import { addSubmissionToQueue } from "@/modules/app/lib/queue/queue-manager";
import { getOrganizationPlanInfo } from "@/modules/core/utils/subscription.utils";
import { sanitizeSubmissionText } from "@/lib/security/submission-security";
import { SubmissionSource } from "@/types/submission.types";
import { userHasPermission } from "@/modules/core/utils/permissions";
import type { Prisma } from "@prisma/client";

export class EmailAccountService {
  private async appendEmailAuditEvent(
    orgId: string,
    event: {
      type:
        | "EMAIL_CONFIG_CREATED"
        | "EMAIL_INBOX_ACTIVATED"
        | "EMAIL_INBOX_DEACTIVATED"
        | "EMAIL_INBOX_AUTO_DEACTIVATED_PLAN";
      actorUserId?: string | null;
      actorEmail?: string | null;
      reason?: string;
    }
  ) {
    const config = await prisma.emailConfiguration.findUnique({
      where: { orgId },
      select: { id: true, providerConfig: true },
    });

    if (!config) return;

    const current =
      config.providerConfig &&
      typeof config.providerConfig === "object" &&
      !Array.isArray(config.providerConfig)
        ? (config.providerConfig as Record<string, unknown>)
        : {};

    const existing = Array.isArray(current.auditEvents)
      ? (current.auditEvents as unknown[])
      : [];

    const nextEvents = [
      ...existing.slice(-49),
      {
        type: event.type,
        actorUserId: event.actorUserId || null,
        actorEmail: event.actorEmail || null,
        reason: event.reason || null,
        timestamp: new Date().toISOString(),
      },
    ];

    await prisma.emailConfiguration.update({
      where: { id: config.id },
      data: {
        providerConfig: ({
          ...current,
          auditEvents: nextEvents,
        } as unknown) as Prisma.InputJsonValue,
      },
    });
  }

  async enforceEmailChannelPlanCompliance(orgId: string) {
    const planInfo = await getOrganizationPlanInfo(orgId);
    const hasEmailChannel = Boolean(
      planInfo?.hasActivePlan && planInfo?.features?.hasEmailChannel
    );

    if (!hasEmailChannel) {
      const deactivation = await prisma.emailConfiguration.updateMany({
        where: { orgId, isActive: true },
        data: {
          isActive: false,
          autoProcess: false,
        },
      });

      await prisma.organization.update({
        where: { id: orgId },
        data: { isEmailChannelActive: false },
      });

      if (deactivation.count > 0) {
        await this.appendEmailAuditEvent(orgId, {
          type: "EMAIL_INBOX_AUTO_DEACTIVATED_PLAN",
          reason: "Plan inactive or without email channel",
        });
      }

      return {
        compliant: false,
        deactivated: deactivation.count > 0,
      };
    }

    return {
      compliant: true,
      deactivated: false,
    };
  }

  /**
   * Crear cuenta de email para una organización
   * Usa Google Workspace API o servicio de email
   */
  async createOrganizationEmail(orgId: string, userId: string, userEmail?: string) {
    // Verificar permisos y plan
    const hasPermission = await this.checkEmailPermission(orgId, userId, userEmail);
    if (!hasPermission) {
      throw new Error("Plan no incluye recepción de emails");
    }

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { slug: true, name: true },
    });

    if (!org) throw new Error("Organización no encontrada");

    // Opción 1: Usar un servicio de forwarding (más simple)
    const emailConfig = await this.createEmailForwarding(org);

    // Opción 2: Crear cuenta real en Google Workspace (más complejo)
    // const emailConfig = await this.createGoogleWorkspaceAccount(org);

    // Guardar configuración inactiva hasta activación explícita
    const config = await prisma.emailConfiguration.upsert({
      where: { orgId },
      update: {
        emailAlias: org.slug,
        emailAddress: emailConfig.address,
        forwardingAddress: emailConfig.forwardingAddress,
        subjectKeywords: ["reporte", "denuncia", "report"],
        emailProvider: emailConfig.provider,
        providerConfig: emailConfig.config,
      },
      create: {
        orgId,
        emailAlias: org.slug,
        emailAddress: emailConfig.address,
        forwardingAddress: emailConfig.forwardingAddress,
        subjectKeywords: ["reporte", "denuncia", "report"],
        autoProcess: true,
        isActive: false,
        emailProvider: emailConfig.provider,
        providerConfig: emailConfig.config,
      },
    });

    await this.appendEmailAuditEvent(orgId, {
      type: "EMAIL_CONFIG_CREATED",
      actorUserId: userId,
      actorEmail: userEmail || null,
    });

    return config;
  }

  async getOrganizationEmailConfiguration(
    orgId: string,
    userId: string,
    userEmail?: string
  ) {
    const canManage = await userHasPermission(
      userId,
      orgId,
      "canManageOrganization",
      userEmail
    );
    if (!canManage) {
      throw new Error("No autorizado para gestionar correo de la organización");
    }

    const config = await prisma.emailConfiguration.findUnique({
      where: { orgId },
      select: {
        id: true,
        orgId: true,
        emailAlias: true,
        emailAddress: true,
        forwardingAddress: true,
        subjectKeywords: true,
        isActive: true,
        autoProcess: true,
        emailProvider: true,
        emailsProcessed: true,
        lastCheckedAt: true,
        createdAt: true,
        updatedAt: true,
        providerConfig: true,
      },
    });

    if (!config) return null;

    const providerConfig =
      config.providerConfig &&
      typeof config.providerConfig === "object" &&
      !Array.isArray(config.providerConfig)
        ? (config.providerConfig as Record<string, unknown>)
        : {};

    const auditEvents = Array.isArray(providerConfig.auditEvents)
      ? providerConfig.auditEvents
      : [];

    return {
      ...config,
      auditEvents,
    };
  }

  async setEmailActivation(
    orgId: string,
    userId: string,
    activate: boolean,
    userEmail?: string
  ) {
    const canManage = await userHasPermission(
      userId,
      orgId,
      "canManageOrganization",
      userEmail
    );
    if (!canManage) {
      throw new Error("No autorizado para activar/desactivar la bandeja");
    }

    const config = await prisma.emailConfiguration.findUnique({
      where: { orgId },
      select: { id: true, isActive: true },
    });

    if (!config) {
      throw new Error("Primero debes crear la configuración de bandeja");
    }

    if (activate) {
      const planInfo = await getOrganizationPlanInfo(orgId);
      const hasEmailChannel = Boolean(
        planInfo?.hasActivePlan && planInfo?.features?.hasEmailChannel
      );
      if (!hasEmailChannel) {
        throw new Error(
          "Tu plan actual no permite activar la bandeja de correo. Actualiza a GROW o superior."
        );
      }
    }

    const updated = await prisma.emailConfiguration.update({
      where: { orgId },
      data: {
        isActive: activate,
        autoProcess: activate,
        lastCheckedAt: activate ? new Date() : undefined,
      },
    });

    await this.appendEmailAuditEvent(orgId, {
      type: activate ? "EMAIL_INBOX_ACTIVATED" : "EMAIL_INBOX_DEACTIVATED",
      actorUserId: userId,
      actorEmail: userEmail || null,
      reason: activate
        ? "Manual activation by organization manager"
        : "Manual deactivation by organization manager",
    });

    return updated;
  }

  /**
   * Opción 1: Usar servicio de email forwarding
   * Servicios como ForwardEmail, ImprovMX, o tu propio dominio
   */
  private async createEmailForwarding(org: any) {
    // Ejemplo con ImprovMX (servicio gratuito de forwarding)
    const baseEmail = process.env.FORWARDING_DOMAIN || "ethicvoice.co";
    const emailAddress = `${org.slug}@${baseEmail}`;
    const forwardTo = process.env.MASTER_INBOX || "info@ethicvoice.co";

    // En producción, llamarías a la API del servicio
    // Por ahora, simulamos la creación
    return {
      address: emailAddress,
      forwardingAddress: forwardTo,
      provider: "improvmx",
      config: {
        alias: org.slug,
        domain: baseEmail,
        forwardTo,
      },
    };
  }

  /**
   * Verificar si el plan incluye emails
   */
  private async checkEmailPermission(
    orgId: string,
    userId: string,
    userEmail?: string
  ): Promise<boolean> {
    const canManage = await userHasPermission(
      userId,
      orgId,
      "canManageOrganization",
      userEmail
    );
    if (!canManage) return false;

    // Verificar plan y que incluya canal de email
    const sub = await prisma.subscription.findFirst({
      where: {
        orgId,
        status: { in: ["ACTIVE", "TRIALING"] },
      },
      orderBy: { createdAt: "desc" },
      select: {
        planType: true,
        status: true,
      },
    });

    if (!sub) return false;

    // Starter no tiene canal email; Grow+ sí
    const plan = (sub as any).planType as string | undefined;
    return plan === "GROW" || plan === "GROW_PRO" || plan === "PREMIUM";
  }
}

// app/lib/services/email-webhook.service.ts
/**
 * Servicio para procesar emails via webhooks
 * Compatible con SendGrid, Mailgun, etc.
 */
export class EmailWebhookService {
  /**
   * Procesar webhook de email entrante
   */
  async processInboundEmail(data: any, provider: string) {
    let emailData;

    switch (provider) {
      case "sendgrid":
        emailData = this.parseSendGridWebhook(data);
        break;
      case "mailgun":
        emailData = this.parseMailgunWebhook(data);
        break;
      case "improvmx":
        emailData = this.parseImprovMXWebhook(data);
        break;
      default:
        throw new Error("Proveedor no soportado");
    }

    if (!emailData.to || !emailData.subject || !emailData.body) {
      throw new Error("Payload de email incompleto");
    }

    // Identificar organización por email
    const emailConfig = await this.identifyOrganization(emailData.to);
    if (!emailConfig) {
      console.log(`Email no reconocido: ${emailData.to}`);
      return;
    }

    const planInfo = await getOrganizationPlanInfo(emailConfig.orgId);
    const hasEmailChannel = Boolean(
      planInfo?.hasActivePlan && planInfo?.features?.hasEmailChannel
    );
    if (!hasEmailChannel) {
      await new EmailAccountService().enforceEmailChannelPlanCompliance(
        emailConfig.orgId
      );
      console.log(
        `[EMAIL_WEBHOOK] Canal email no habilitado para org ${emailConfig.orgId}`
      );
      return {
        success: false,
        skipped: true,
        reason: "email_channel_not_enabled",
      };
    }

    const deduplicationHash = this.buildEmailDeduplicationKey(
      provider,
      emailData
    );
    const existingSubmission = await prisma.formSubmission.findFirst({
      where: {
        orgId: emailConfig.orgId,
        metadata: {
          path: ["deduplicationHash"],
          equals: deduplicationHash,
        },
      },
      select: { id: true },
      orderBy: { id: "desc" },
    });

    if (existingSubmission) {
      return {
        success: true,
        duplicate: true,
        submissionId: existingSubmission.id,
      };
    }

    const normalizedContent = sanitizeSubmissionText(
      this.formatEmailContent(emailData),
      12000
    );

    const submission = await prisma.formSubmission.create({
      data: {
        orgId: emailConfig.orgId,
        content: normalizedContent,
        source: SubmissionSource.EMAIL,
        status: "PENDING",
        isAnonymous: false,
        reporterEmail: emailData.from || null,
        reporterName: emailData.fromName || null,
        metadata: {
          source: SubmissionSource.EMAIL,
          emailProvider: provider,
          emailId: emailData.messageId || null,
          deduplicationHash,
          from: emailData.from,
          to: emailData.to,
          subject: emailData.subject,
          receivedAt: emailData.date
            ? new Date(emailData.date).toISOString()
            : new Date().toISOString(),
        },
      },
    });

    const canUseAi = Boolean(planInfo?.features?.hasAiProcessing);
    if (canUseAi) {
      await addSubmissionToQueue({
        orgId: emailConfig.orgId,
        content: normalizedContent,
        source: SubmissionSource.EMAIL,
        metadata: {
          submissionId: submission.id,
          emailId: emailData.messageId || null,
          deduplicationHash,
          emailProvider: provider,
        },
        reporterInfo: {
          email: emailData.from || null,
          name: emailData.fromName || null,
          isAnonymous: false,
        },
      });
    }

    return {
      success: true,
      submissionId: submission.id,
      queued: canUseAi,
      aiEnabled: canUseAi,
    };
  }

  private async identifyOrganization(toEmail: string) {
    // Extraer alias del email
    const [localPart] = toEmail.split("@");

    const config = await prisma.emailConfiguration.findFirst({
      where: {
        OR: [{ emailAddress: toEmail }, { emailAlias: localPart }],
        isActive: true,
      },
      include: {
        organization: true,
      },
    });

    return config;
  }

  private buildEmailDeduplicationKey(provider: string, emailData: any) {
    const messageId = String(emailData.messageId || "").trim().toLowerCase();
    if (messageId) {
      return createHash("sha256")
        .update(`${provider}:${messageId}`)
        .digest("hex");
    }

    return createHash("sha256")
      .update(
        [
          provider,
          String(emailData.from || "").trim().toLowerCase(),
          String(emailData.to || "").trim().toLowerCase(),
          String(emailData.subject || "").trim().toLowerCase(),
          new Date(emailData.date || Date.now()).toISOString().slice(0, 19),
          String(emailData.body || "").trim().slice(0, 300),
        ].join("|")
      )
      .digest("hex");
  }

  private parseSendGridWebhook(data: any) {
    return {
      from: data.from,
      fromName: data.fromname,
      to: data.to,
      subject: data.subject,
      body: data.text || data.html,
      date: new Date(data.headers?.Date || Date.now()),
      messageId:
        data.headers?.["Message-Id"] ||
        data.headers?.["message-id"] ||
        data["message-id"] ||
        data.messageId ||
        null,
      attachments: data.attachments || [],
    };
  }

  private parseMailgunWebhook(data: any) {
    return {
      from: data.sender,
      fromName: data.From?.split("<")[0]?.trim(),
      to: data.recipient,
      subject: data.subject,
      body: data["body-plain"] || data["body-html"],
      date: new Date(data.Date || Date.now()),
      messageId:
        data["Message-Id"] || data["message-id"] || data.messageId || null,
      attachments: [],
    };
  }

  private parseImprovMXWebhook(data: any) {
    return {
      from: data.sender,
      fromName: data.sender_name,
      to: data.recipient,
      subject: data.subject,
      body: data.text || data.html,
      date: new Date(data.timestamp),
      messageId: data["message-id"] || data.messageId || null,
      attachments: data.attachments || [],
    };
  }

  private formatEmailContent(emailData: any): string {
    return `
Asunto: ${emailData.subject}
De: ${emailData.fromName} <${emailData.from}>
Fecha: ${emailData.date}

${emailData.body}
    `.trim();
  }
}
