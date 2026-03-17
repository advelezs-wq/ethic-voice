"use client";

import { Form, Input } from "@heroui/react";
import {
  ElementsType,
  FormElement,
  FormElementInstance,
} from "../components/FormElements";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useDesigner } from "../hooks/useDesigner";

const type: ElementsType = "TitleField";

const extraAttributes = {
  title: "Title field",
};

const propertiesSchema = z.object({
  title: z.string().min(2).max(50),
});

type propertiesSchemaType = z.infer<typeof propertiesSchema>;

export const TitleFieldFormElement: FormElement = {
  type,
  construct: (id: string) => ({
    id,
    type,
    extraAttributes,
  }),
  designerBtnElement: {
    icon: (
      <i
        className="icon-[ci--heading-h1] size-8 text-black"
        role="img"
        aria-hidden="true"
      />
    ),
    label: "Title field",
  },
  designerComponent: DesignerComponent,
  formComponent: FormComponent,
  propertiesComponent: PropertiesComponent,
  validate: (): boolean => true,
};

type CustomInstance = FormElementInstance & {
  extraAttributes: typeof extraAttributes;
};

function DesignerComponent({
  elementInstance,
}: {
  elementInstance: FormElementInstance;
}) {
  const element = elementInstance as CustomInstance;

  const { title } = element.extraAttributes;

  return (
    <div className="flex flex-col gap-2 w-full">
      <p>Title field</p>
      <p className="text-xl">{title}</p>
    </div>
  );
}
function FormComponent({
  elementInstance,
}: {
  elementInstance: FormElementInstance;
}) {
  const element = elementInstance as CustomInstance;

  const { title } = element.extraAttributes;

  return <p className="text-xl">{title}</p>;
}

function PropertiesComponent({
  elementInstance,
}: {
  elementInstance: FormElementInstance;
}) {
  const element = elementInstance as CustomInstance;

  const { updateElement } = useDesigner();

  const form = useForm<propertiesSchemaType>({
    resolver: zodResolver(propertiesSchema),
    mode: "onBlur",
    defaultValues: {
      title: element.extraAttributes.title,
    },
  });

  useEffect(() => {
    form.reset(element.extraAttributes);
  }, [element, form]);

  function applyChanges(values: propertiesSchemaType) {
    updateElement(element.id, {
      ...element,
      extraAttributes: {
        title: values.title,
      },
    });
  }

  return (
    <Form {...form}>
      <form
        onBlur={form.handleSubmit(applyChanges)}
        onSubmit={(e) => {
          e.preventDefault();
        }}
        className="space-y-3 w-full"
      >
        <Controller
          control={form.control}
          name="title"
          render={({ field, fieldState: { error } }) => (
            <Input
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              label="Title"
              {...field}
              errorMessage={error?.message}
              isInvalid={error ? true : false}
            />
          )}
        />
      </form>
    </Form>
  );
}
