"use client";

import { Form, Textarea } from "@heroui/react";
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

const type: ElementsType = "ParagraphField";

const extraAttributes = {
  text: "Text field",
};

const propertiesSchema = z.object({
  text: z.string().min(2).max(500),
});

type propertiesSchemaType = z.infer<typeof propertiesSchema>;

export const ParagraphFieldFormElement: FormElement = {
  type,
  construct: (id: string) => ({
    id,
    type,
    extraAttributes,
  }),
  designerBtnElement: {
    icon: (
      <i
        className="icon-[mi--text] size-8 text-black"
        role="img"
        aria-hidden="true"
      />
    ),
    label: "Campo de texto",
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

  const { text } = element.extraAttributes;

  return (
    <div className="flex flex-col gap-2 w-full">
      <p>Campo de texto</p>
      <p>{text}</p>
    </div>
  );
}
function FormComponent({
  elementInstance,
}: {
  elementInstance: FormElementInstance;
}) {
  const element = elementInstance as CustomInstance;

  const { text } = element.extraAttributes;

  return <p>{text}</p>;
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
      text: element.extraAttributes.text,
    },
  });

  useEffect(() => {
    form.reset(element.extraAttributes);
  }, [element, form]);

  function applyChanges(values: propertiesSchemaType) {
    updateElement(element.id, {
      ...element,
      extraAttributes: {
        text: values.text,
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
          name="text"
          render={({ field, fieldState: { error } }) => (
            <Textarea
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              label="Texto"
              {...field}
              errorMessage={error?.message}
              isInvalid={error ? true : false}
              rows={5}
            />
          )}
        />
      </form>
    </Form>
  );
}
