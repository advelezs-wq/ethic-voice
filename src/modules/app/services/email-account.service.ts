/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from "@/modules/prisma/lib/prisma";

export class EmailAccountService {
  /**
   * Crear cuenta de email para una organización
   * Usa Google Workspace API o servicio de email
   */
  async createOrganizationEmail(orgId: string, userId: string) {
    // Verificar permisos y plan
    const hasPermission = await this.checkEmailPermission(orgId, userId);
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

    // Guardar configuración
    const config = await prisma.emailConfiguration.create({
      data: {
        orgId,
        emailAlias: org.slug,
        emailAddress: emailConfig.address,
        forwardingAddress: emailConfig.forwardingAddress,
        subjectKeywords: ["reporte", "denuncia", "report"],
        isActive: true,
        emailProvider: emailConfig.provider,
        providerConfig: emailConfig.config,
      },
    });

    return config;
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
    userId: string
  ): Promise<boolean> {
    // Verificar membership
    const membership = await prisma.organizationMembership.findFirst({
      where: { orgId, userId, role: "ADMIN" },
    });

    if (!membership) return false;

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

    // Identificar organización por email
    const org = await this.identifyOrganization(emailData.to);
    if (!org) {
      console.log(`Email no reconocido: ${emailData.to}`);
      return;
    }

    // Procesar con AI
    const { submissionProcessor } = await import(
      "./submission-processor.service"
    );

    const result = await submissionProcessor.processSubmission({
      orgId: org.id,
      content: this.formatEmailContent(emailData),
      source: "EMAIL" as any,
      metadata: {
        emailProvider: provider,
        from: emailData.from,
        subject: emailData.subject,
        receivedAt: emailData.date,
      },
      reporterInfo: {
        email: emailData.from,
        name: emailData.fromName,
        isAnonymous: false,
      },
    });

    return result;
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

    return config?.organization;
  }

  private parseSendGridWebhook(data: any) {
    return {
      from: data.from,
      fromName: data.fromname,
      to: data.to,
      subject: data.subject,
      body: data.text || data.html,
      date: new Date(data.headers?.Date || Date.now()),
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
