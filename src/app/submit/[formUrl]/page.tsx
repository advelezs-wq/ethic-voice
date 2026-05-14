import { GetFormContentById } from "@/actions/form";
import { FormElementInstance } from "@/modules/forms/builder/components/FormElements";
import { FormSubmitComponent } from "@/modules/forms/components/FormSubmitComponent";

const SubmitPage = async ({
  params,
}: {
  params: Promise<{ formUrl: string }>;
}) => {
  const { formUrl } = await params;

  const form = await GetFormContentById(formUrl);

  if (!form) {
    throw new Error("form not found");
  }

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
};

export default SubmitPage;
