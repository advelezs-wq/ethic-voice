import { Form } from "@prisma/client";
import { formatDistance } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

export const FormCard = ({ form }: { form: Form }) => {
  return (
    <div className="rounded-xl border border-emerald-100 bg-white">
      <div className="flex-col items-start p-4">
        <div className="flex items-center gap-2 justify-between w-full">
          <span className="truncate font-bold">{form.title}</span>
          {form.isPublished && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
              Publicado
            </span>
          )}
          {!form.isPublished && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-slate-600">
              Borrador
            </span>
          )}
        </div>
        <div className="w-full flex flex-row items-center justify-between text-slate-600 text-sm flex-none">
          {formatDistance(form.createdAt, new Date(), {
            addSuffix: true,
            locale: es,
          })}
          {form.isPublished && (
            <span className="flex items-center gap-2">
              <i
                className="icon-[lets-icons--view] text-slate-600"
                role="img"
                aria-hidden="true"
              />
              <span>{form.visits.toLocaleString()}</span>
              <i
                className="icon-[lets-icons--form] text-slate-600"
                role="img"
                aria-hidden="true"
              />
              <span>{form.submissionsCount.toLocaleString()}</span>
            </span>
          )}
        </div>
      </div>
      <div className="h-[20px] truncate text-sm text-slate-600 px-4">
        {form.description || "Sin descripción"}
      </div>
      <div className="justify-center p-4 flex">
        {form.isPublished && (
          <Link
            href={`/app/your-forms/builder/${form.id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-white px-4 py-2 text-sm font-medium hover:opacity-90"
          >
            Ver respuestas
            <i
              className="icon-[bx--right-arrow-alt]"
              role="img"
              aria-hidden="true"
            />
          </Link>
        )}
        {!form.isPublished && (
          <Link
            href={`/app/your-forms/builder/${form.id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-white px-4 py-2 text-sm font-medium hover:opacity-90"
          >
            Editar formulario
            <i
              className="icon-[ant-design--form-outlined]"
              role="img"
              aria-hidden="true"
            />
          </Link>
        )}
      </div>
    </div>
  );
};
