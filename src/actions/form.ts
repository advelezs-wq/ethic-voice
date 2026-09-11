"use server";

import { formSchema, formSchemaType } from "@/modules/forms/lib/schemas/form";
import prisma from "@/modules/prisma/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { resolveOrgId } from "@/modules/core/utils/org-resolver";

class UserNotFoundErr extends Error {}

export interface FormPosterData {
  title: string;
  shareURL: string;
  orgName: string;
  orgLogoUrl: string | null;
}

// Org-scoped (not userId-scoped like the rest of this file) since any team
// member should be able to print the poster for the org's reporting form,
// not just whoever originally created it.
export async function getFormPosterData(
  formId: number
): Promise<FormPosterData | null> {
  const { userId } = await auth();
  const orgId = await resolveOrgId();
  if (!userId || !orgId) throw new Error("No autorizado");

  const form = await prisma.form.findFirst({
    where: { id: formId, orgId },
    select: {
      title: true,
      shareURL: true,
      organization: { select: { name: true, logoUrl: true } },
    },
  });
  if (!form) return null;

  return {
    title: form.title,
    shareURL: form.shareURL,
    orgName: form.organization.name,
    orgLogoUrl: form.organization.logoUrl,
  };
}

export async function GetFormStats() {
  const orgId = await resolveOrgId();
  if (!orgId) {
    throw new Error("No autorizado");
  }

  const stats = prisma.form.aggregate({
    where: {
      orgId,
    },
    _sum: {
      visits: true,
      submissionsCount: true,
    },
  });

  const visits = (await stats)._sum?.visits || 0;
  const submissions = (await stats)._sum?.submissionsCount || 0;

  let submissionRate = 0;

  if (visits > 0) {
    submissionRate = (submissions / visits) * 100;
  }

  const bounceRate = 100 - submissionRate;

  return {
    visits,
    submissions,
    submissionRate,
    bounceRate,
  };
}

export async function CreateForm(data: formSchemaType) {
  const validation = formSchema.safeParse(data);

  if (!validation.success) {
    throw new Error("form not valid");
  }

  const user = await currentUser();
  if (!user) {
    throw new UserNotFoundErr();
  }

  // resolveOrgId() reads the app's own org context (ev_org cookie / the
  // user's OrganizationMembership) — not Clerk's own Organizations feature,
  // which this app never activates (no setActive({ organization }) call
  // anywhere), so auth().orgId is always undefined. Using it here meant
  // orgId was always undefined and every form.create() failed its required
  // orgId field — no organization has ever been able to create a form.
  const orgId = await resolveOrgId();
  if (!orgId) {
    throw new Error("No autorizado");
  }

  // El primer formulario de la organización se marca como "canónico": es el
  // que resuelve el link único de denuncias (Organization.slug) para planes
  // Grow o superior — ver /submit/[formUrl].
  const existingFormsCount = await prisma.form.count({
    where: { orgId },
  });

  const form = await prisma.form.create({
    data: {
      userId: user.id,
      title: data.name!,
      description: data.description!,
      orgId,
      isDefault: existingFormsCount === 0,
    },
  });

  if (!form) {
    throw new Error("Something went wrong");
  }

  return form.id;
}

export async function GetForms() {
  // Scoped by org, not by the creating user — a form is the organization's
  // shared reporting channel, and any teammate managing it needs to see it,
  // not just whoever happened to create it.
  const orgId = await resolveOrgId();
  if (!orgId) {
    throw new Error("No autorizado");
  }

  return await prisma.form.findMany({
    where: {
      orgId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function GetFormById(id: number) {
  const orgId = await resolveOrgId();
  if (!orgId) {
    throw new Error("No autorizado");
  }

  return await prisma.form.findUnique({
    where: {
      orgId,
      id,
    },
    include: {
      submissions: true,
    },
  });
}

export async function UpdateFormContent(id: number, jsonContent: string) {
  const orgId = await resolveOrgId();
  if (!orgId) {
    throw new Error("No autorizado");
  }

  return await prisma.form.update({
    where: {
      orgId,
      id,
    },
    data: {
      content: jsonContent,
    },
  });
}

export async function PublishForm(id: number) {
  const orgId = await resolveOrgId();
  if (!orgId) {
    throw new Error("No autorizado");
  }

  return await prisma.form.update({
    data: {
      isPublished: true,
    },
    where: {
      orgId,
      id,
    },
  });
}

export async function GetFormContentById(formUrl: string) {
  return await prisma.form.update({
    select: {
      content: true,
      organization: true,
    },
    data: {
      visits: {
        increment: 1,
      },
    },
    where: {
      shareURL: formUrl,
    },
  });
}

export async function SubmitForm(formUrl: string, content: string) {
  // First, get the form with its organization relation
  const form = await prisma.form.findUnique({
    where: {
      shareURL: formUrl,
      isPublished: true,
    },
    select: {
      id: true,
      orgId: true,
    },
  });

  if (!form) {
    throw new Error("Form not found");
  }

  // Update the form and create the submission with organization relation
  return await prisma.form.update({
    data: {
      submissionsCount: {
        increment: 1,
      },
      submissions: {
        create: {
          content,
          orgId: form.orgId, // Add the organization ID here
        },
      },
    },
    where: {
      shareURL: formUrl,
      isPublished: true,
    },
  });
}

export async function GetFormWithSubmissions(id: number) {
  const orgId = await resolveOrgId();
  if (!orgId) {
    throw new Error("No autorizado");
  }

  return await prisma.form.findUnique({
    where: {
      id,
      orgId,
    },
    include: {
      submissions: true,
    },
  });
}
