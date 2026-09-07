import { GetFormContentById } from "@/actions/form";
import { FormElementInstance } from "@/modules/forms/builder/components/FormElements";
import { FormSubmitComponent } from "@/modules/forms/components/FormSubmitComponent";
import { SubmitPageWrapper } from "@/modules/submit/components/SubmitPageWrapper";
import prisma from "@/modules/prisma/lib/prisma";
import { PlanType } from "@/types/subscription.types";
import { notFound, redirect } from "next/navigation";

const SubmitPage = async ({
  params,
}: {
  params: Promise<{ formUrl: string }>;
}) => {
  const { formUrl } = await params;

  // 1) ¿Coincide con el link de un formulario personalizado (Form.shareURL)?
  // GetFormContentById lanza si no encuentra el registro (prisma.update en
  // un where sin match), así que un "miss" se trata como "no es un form".
  let form: Awaited<ReturnType<typeof GetFormContentById>> | null = null;
  try {
    form = await GetFormContentById(formUrl);
  } catch {
    form = null;
  }

  if (form) {
    const formContent = JSON.parse(form.content) as FormElementInstance[];

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f7faf9] via-white to-lime-50/40 px-4 py-10 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 rounded-3xl border border-[#0a1e14]/10 bg-white/85 p-6 shadow-[0_24px_70px_-40px_rgba(10,30,20,0.45)] backdrop-blur sm:p-8">
          <header className="w-full flex items-center justify-center">
            {form.organization.logoUrl ? (
              <img
                src={form.organization.logoUrl}
                alt={form.organization.name}
                className="size-32 object-contain"
              />
            ) : (
              <div className="size-32 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl font-semibold text-gray-500">
                {form.organization.name.charAt(0).toUpperCase()}
              </div>
            )}
          </header>
          <main className="w-full flex flex-col gap-6 items-center justify-center">
            <h2 className="text-center text-3xl font-semibold text-[#0a1e14] sm:text-4xl">
              Formulario de denuncias de {form.organization.name}
            </h2>
            <FormSubmitComponent formUrl={formUrl} content={formContent} />
          </main>
        </div>
      </div>
    );
  }

  // 2) No es un Form.shareURL: puede ser el link único y permanente de una
  // organización (Organization.slug), generado automáticamente al crearla
  // desde el Super Admin — ver "Link de denuncias" en la ficha del cliente.
  const organization = await prisma.organization.findFirst({
    where: { slug: formUrl, isActive: true },
  });

  if (!organization) {
    notFound();
  }

  const isGrowOrAbove = organization.currentPlan !== PlanType.STARTER;

  if (isGrowOrAbove) {
    const defaultForm = await prisma.form.findFirst({
      where: { orgId: organization.id, isDefault: true },
    });
    if (defaultForm) {
      redirect(`/submit/${defaultForm.shareURL}`);
    }
    // Grow+ pero todavía sin formulario personalizado propio: cae al canal
    // genérico de abajo hasta que la organización construya el suyo.
  }

  return (
    <div className="min-h-[calc(100dvh-5rem)] bg-gradient-to-br from-[#f7faf9] via-white to-lime-50/30">
      <SubmitPageWrapper initialOrganization={organization} />
    </div>
  );
};

export default SubmitPage;
