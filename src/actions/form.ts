"use server";

import { formSchema, formSchemaType } from "@/modules/forms/lib/schemas/form";
import prisma from "@/modules/prisma/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";

class UserNotFoundErr extends Error {}

export async function GetFormStats() {
  const user = await currentUser();
  if (!user) {
    throw new UserNotFoundErr();
  }

  const stats = prisma.form.aggregate({
    where: {
      userId: user.id,
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

  const { orgId } = await auth();

  if (!user) {
    throw new UserNotFoundErr();
  }

  const form = await prisma.form.create({
    data: {
      userId: user.id,
      title: data.name!,
      description: data.description!,
      orgId: orgId as string,
    },
  });

  if (!form) {
    throw new Error("Something went wrong");
  }

  return form.id;
}

export async function GetForms() {
  const user = await currentUser();
  if (!user) {
    throw new UserNotFoundErr();
  }

  return await prisma.form.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function GetFormById(id: number) {
  const user = await currentUser();
  if (!user) {
    throw new UserNotFoundErr();
  }

  return await prisma.form.findUnique({
    where: {
      userId: user.id,
      id,
    },
    include: {
      submissions: true,
    },
  });
}

export async function UpdateFormContent(id: number, jsonContent: string) {
  const user = await currentUser();
  if (!user) {
    throw new UserNotFoundErr();
  }

  return await prisma.form.update({
    where: {
      userId: user.id,
      id,
    },
    data: {
      content: jsonContent,
    },
  });
}

export async function PublishForm(id: number) {
  const user = await currentUser();
  if (!user) {
    throw new UserNotFoundErr();
  }

  return await prisma.form.update({
    data: {
      isPublished: true,
    },
    where: {
      userId: user.id,
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
  const user = await currentUser();
  if (!user) {
    throw new UserNotFoundErr();
  }

  return await prisma.form.findUnique({
    where: {
      id,
      userId: user.id,
    },
    include: {
      submissions: true,
    },
  });
}
