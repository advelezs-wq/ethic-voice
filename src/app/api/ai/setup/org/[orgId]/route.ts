import prisma from "@/modules/prisma/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const orgId = (await params).orgId;

    // Check if user has access to this org
    const membership = await prisma.organizationMembership.findFirst({
      where: {
        userId,
        orgId,
        role: "ADMIN",
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    // Get organization details
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { slug: true, name: true },
    });

    if (!org) {
      return NextResponse.json(
        { error: "Organización no encontrada" },
        { status: 404 }
      );
    }

    // Create or update email configuration
    const emailConfig = await prisma.emailConfiguration.upsert({
      where: { orgId },
      create: {
        orgId,
        emailAlias: org.slug,
        emailAddress: `${process.env.REPORTS_EMAIL_BASE?.split("@")[0]}+${
          org.slug
        }@${process.env.REPORTS_EMAIL_BASE?.split("@")[1]}`,
        subjectKeywords: ["reporte", "denuncia", "report", "complaint"],
        autoProcess: true,
        isActive: true,
      },
      update: {
        emailAlias: org.slug,
        emailAddress: `${process.env.REPORTS_EMAIL_BASE?.split("@")[0]}+${
          org.slug
        }@${process.env.REPORTS_EMAIL_BASE?.split("@")[1]}`,
      },
    });

    // Create default AI templates
    const templates = [
      {
        name: "Análisis Estándar",
        description: "Template por defecto para análisis de reportes",
        templateType: "analysis",
        isDefault: true,
        variables: ["content", "source", "orgName", "departments"],
      },
      {
        name: "Resumen Ejecutivo",
        description: "Template para generar resúmenes ejecutivos",
        templateType: "summary",
        isDefault: false,
        variables: ["content", "severity", "keyFindings"],
      },
    ];

    for (const template of templates) {
      // First check if template exists
      const existingTemplate = await prisma.aiTemplate.findFirst({
        where: {
          orgId,
          name: template.name,
        },
      });

      if (!existingTemplate) {
        await prisma.aiTemplate.create({
          data: {
            orgId,
            ...template,
            promptTemplate: getDefaultPromptTemplate(template.templateType),
          },
        });
      }
    }

    // Create default processing rules
    const rules = [
      {
        ruleName: "Casos Críticos - Asignación Automática",
        description:
          "Asigna automáticamente casos de alta severidad a administradores",
        conditions: { severity: "HIGH" },
        actions: { assignToAdmins: true, setPriority: "URGENT" },
        priority: 100,
      },
      {
        ruleName: "Fraude - Departamento Financiero",
        description: "Asigna casos de fraude al departamento financiero",
        conditions: {
          type: "fraude",
          contains: ["fraude", "malversación", "robo"],
        },
        actions: { assignToDepartment: "financiero" },
        priority: 90,
      },
    ];

    for (const rule of rules) {
      // First check if rule exists
      const existingRule = await prisma.processingRule.findFirst({
        where: {
          orgId,
          ruleName: rule.ruleName,
        },
      });

      if (!existingRule) {
        await prisma.processingRule.create({
          data: {
            orgId,
            ...rule,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      emailConfig,
      message: "Configuración AI creada exitosamente",
    });
  } catch (error) {
    console.error("Error setting up AI:", error);
    return NextResponse.json(
      { error: "Error configurando AI" },
      { status: 500 }
    );
  }
}

function getDefaultPromptTemplate(type: string): string {
  if (type === "analysis") {
    return `Analiza el siguiente reporte para {orgName}...`;
  } else if (type === "summary") {
    return `Genera un resumen ejecutivo del siguiente reporte...`;
  }
  return "";
}
