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
    <div className="flex flex-col gap-8 p-6">
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
        <h2 className="text-4xl font-mediums">
          Formulario de denuncias de {form.organization.name}
        </h2>
        <FormSubmitComponent formUrl={formUrl} content={formContent} />
      </main>
    </div>
  );
};

export default SubmitPage;
