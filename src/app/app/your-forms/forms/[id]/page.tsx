import { GetFormById } from "@/actions/form";
import { FormLinkShare } from "@/modules/forms/components/FormLinkShare";
import { CardStats } from "@/modules/forms/components/forms-stats/CardStats";
import { SubmissionsTable } from "@/modules/forms/components/SubmissionsTable";
import { VisitBtn } from "@/modules/forms/components/VisitBtn";
import React from "react";

const FormDetailPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const formId = (await params).id;

  const form = await GetFormById(Number(formId));

  if (!form) {
    throw new Error("Form not found");
  }

  const { visits, submissionsCount } = form;

  let submissionRate = 0;

  if (visits > 0) {
    submissionRate = (submissionsCount / visits) * 100;
  }

  const bounceRate = 100 - submissionRate;

  return (
    <>
      <div className="py-10 border-y border-gray-600">
        <div className="flex justify-between container">
          <h1 className="text-4xl font-bold truncate">{form.title}</h1>
          <VisitBtn shareUrl={form.shareURL} />
        </div>
      </div>
      <div className="py-4 border-b border-gray-600">
        <div className="container flex gap-2 items-center justify-between">
          <FormLinkShare shareUrl={form.shareURL} />
        </div>
      </div>
      <div className="w-full pt-8 gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 container">
        <CardStats
          title="Total visits"
          icon={
            <i
              className="icon-[lets-icons--view] size-5"
              role="img"
              aria-hidden="true"
            />
          }
          helperText="All time form visits"
          value={visits.toLocaleString() || ""}
          isLoading={false}
          className="shadow-md"
        />
        <CardStats
          title="Total submissions"
          icon={
            <i
              className="icon-[humbleicons--upload] size-5"
              role="img"
              aria-hidden="true"
            />
          }
          helperText="All time form submissions"
          value={submissionsCount.toLocaleString() || ""}
          isLoading={false}
          className="shadow-md "
        />
        <CardStats
          title="Submission rate"
          icon={
            <i
              className="icon-[mdi--cursor-default-click-outline] size-5"
              role="img"
              aria-hidden="true"
            />
          }
          helperText="Visits that result in form submissions"
          value={submissionRate.toLocaleString() + "%" || ""}
          isLoading={false}
          className="shadow-md "
        />
        <CardStats
          title="Bounce rate"
          icon={
            <i
              className="icon-[tabler--bounce-right] size-5"
              role="img"
              aria-hidden="true"
            />
          }
          helperText="Visits that leaves without interacting"
          value={bounceRate.toLocaleString() + "%" || ""}
          isLoading={false}
          className="shadow-md "
        />
      </div>
      <div className="container pt-10">
        <SubmissionsTable form={form} />
      </div>
    </>
  );
};

export default FormDetailPage;
