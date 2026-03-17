import { Form } from "@prisma/client";
import { formatDistance } from "date-fns";
import Link from "next/link";

export const FormCard = ({ form }: { form: Form }) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex-col items-start p-4">
        <div className="flex items-center gap-2 justify-between w-full">
          <span className="truncate font-bold">{form.title}</span>
          {form.isPublished && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
              Published
            </span>
          )}
          {!form.isPublished && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
              Draft
            </span>
          )}
        </div>
        <div className="w-full flex flex-row items-center justify-between text-gray-700 text-sm flex-none">
          {formatDistance(form.createdAt, new Date(), {
            addSuffix: true,
          })}
          {form.isPublished && (
            <span className="flex items-center gap-2">
              <i
                className="icon-[lets-icons--view] text-gray-700"
                role="img"
                aria-hidden="true"
              />
              <span>{form.visits.toLocaleString()}</span>
              <i
                className="icon-[lets-icons--form] text-gray-700"
                role="img"
                aria-hidden="true"
              />
              <span>{form.submissionsCount.toLocaleString()}</span>
            </span>
          )}
        </div>
      </div>
      <div className="h-[20px] truncate text-sm text-gray-700 px-4">
        {form.description || "No description"}
      </div>
      <div className="justify-center p-4 flex">
        {form.isPublished && (
          <Link
            href={`/app/your-forms/builder/${form.id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-white px-4 py-2 text-sm font-medium hover:opacity-90"
          >
            View submissions
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
            Edit form
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
