"use client";

import { Form, Slider } from "@heroui/react";
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

const type: ElementsType = "SpacerField";

const extraAttributes = {
  height: 20, // px
};

const propertiesSchema = z.object({
  height: z.number().min(5).max(200),
});

type propertiesSchemaType = z.infer<typeof propertiesSchema>;

export const SpacerFieldFormElement: FormElement = {
  type,
  construct: (id: string) => ({
    id,
    type,
    extraAttributes,
  }),
  designerBtnElement: {
    icon: (
      <i
        className="icon-[lucide--separator-horizontal] size-8 text-black"
        role="img"
        aria-hidden="true"
      />
    ),
    label: "Espaciado horizontal",
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

  const { height } = element.extraAttributes;

  return (
    <div className="flex flex-col gap-2 w-full items-center">
      <p>Espaciado horizontal: {height}px</p>
      <i
        className="icon-[lucide--separator-horizontal] size-8 text-black"
        role="img"
        aria-hidden="true"
      />
    </div>
  );
}

function FormComponent({
  elementInstance,
}: {
  elementInstance: FormElementInstance;
}) {
  const element = elementInstance as CustomInstance;

  const { height } = element.extraAttributes;

  return <div style={{ height, width: "100%" }}></div>;
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
      height: element.extraAttributes.height,
    },
  });

  useEffect(() => {
    form.reset(element.extraAttributes);
  }, [element, form]);

  function applyChanges(values: propertiesSchemaType) {
    updateElement(element.id, {
      ...element,
      extraAttributes: {
        height: values.height,
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
          name="height"
          render={({ field }) => (
            <>
              <Slider
                defaultValue={[field.value]}
                minValue={5}
                maxValue={200}
                step={1}
                value={[field.value]}
                size="md"
                color="primary"
                classNames={{
                  filler: "bg-black",
                  thumb: " bg-black",
                }}
                onChange={(value) => {
                  const newValue = Array.isArray(value) ? value[0] : value;
                  field.onChange(newValue);
                }}
              />
              <p className="text-default-500 font-medium text-small">
                Altura actual: {field.value}px
              </p>
            </>
          )}
        />
      </form>
    </Form>
  );
}
