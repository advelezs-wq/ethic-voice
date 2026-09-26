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
      <div className="mx-auto w-full max-w-[var(--ev-max)] px-[var(--ev-gutter)] pb-24 pt-10 sm:pt-14">
        <div className="ev-label flex items-center justify-between border-b border-ev-line pb-4 text-ev-mute">
          <span>Canal de denuncias</span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-ev-signal" /> Confidencial · Cifrado
          </span>
        </div>
        <div className="mx-auto mt-12 flex max-w-4xl flex-col gap-10">
          <header className="flex items-center gap-5">
            {form.organization.logoUrl ? (
              <img
                src={form.organization.logoUrl}
                alt={form.organization.name}
                className="h-16 w-16 shrink-0 rounded-xl bg-white object-contain p-1.5 ring-1 ring-ev-line"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-ev-night font-mono text-xl text-ev-signal">
                {form.organization.name.charAt(0).toUpperCase()}
              </div>
            )}
            <h1 className="text-[clamp(1.75rem,3.6vw,3rem)] font-semibold leading-[1.05] tracking-[-0.045em] text-ev-night">
              Línea ética de {form.organization.name}
            </h1>
          </header>
          <main className="w-full rounded-[1.75rem] border border-ev-night/10 bg-white p-5 shadow-[0_50px_100px_-50px_rgba(11,29,33,0.35)] sm:p-9">
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
    <div>
      <SubmitPageWrapper initialOrganization={organization} />
    </div>
  );
};

export default SubmitPage;
