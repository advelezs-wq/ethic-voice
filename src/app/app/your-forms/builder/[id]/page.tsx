import { GetFormById } from "@/actions/form";
import { FormBuilder } from "@/modules/forms/builder/components/FormBuilder";
import React from "react";

const BuilderPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const formId = (await params).id;

  const form = await GetFormById(Number(formId));

  if (!form) {
    throw new Error("Form not found");
  }

  return <FormBuilder form={form} />;
};

export default BuilderPage;
