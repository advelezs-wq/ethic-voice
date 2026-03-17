"use client";

import { Form, Input, Slider, Switch, Textarea } from "@heroui/react";
import {
  ElementsType,
  FormElement,
  FormElementInstance,
  SubmitFunction,
} from "../components/FormElements";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useDesigner } from "../hooks/useDesigner";

const type: ElementsType = "TextAreaField";

const extraAttributes = {
  label: "Campo de texto abierto",
  helperText: "Texto de ayuda",
  required: false,
  placeHolder: "Escribe acá...",
  rows: 3,
};

const propertiesSchema = z.object({
  label: z.string().min(2).max(50),
  helperText: z.string().max(20),
  required: z.boolean().default(false).optional(),
  placeHolder: z.string().max(50),
  rows: z.number().min(1).max(10),
});

type propertiesSchemaType = z.infer<typeof propertiesSchema>;

export const TextAreaFieldFormElement: FormElement = {
  type,
  construct: (id: string) => ({
    id,
    type,
    extraAttributes,
  }),
  designerBtnElement: {
    icon: (
      <i
        className="icon-[bi--textarea-resize] size-8 text-black"
        role="img"
        aria-hidden="true"
      />
    ),
    label: "Campo de texto abierto",
  },
  designerComponent: DesignerComponent,
  formComponent: FormComponent,
  propertiesComponent: PropertiesComponent,
  validate: (
    formElement: FormElementInstance,
    currentValue: string
  ): boolean => {
    const element = formElement as CustomInstance;

    if (element.extraAttributes.required) {
      return currentValue.length > 0;
    }

    return true;
  },
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

  const { label, required, placeHolder, helperText } = element.extraAttributes;

  return (
    <div className="flex flex-col gap-2 w-full">
      <Textarea
        readOnly
        label={label}
        isRequired={required}
        placeholder={placeHolder}
        className="shadow-none"
      />
      {helperText && (
        <p className="text-gray-600 text-[0.8rem]">{helperText}</p>
      )}
    </div>
  );
}
function FormComponent({
  elementInstance,
  submitValue,
  isInvalid,
  defaultValue,
}: {
  elementInstance: FormElementInstance;
  submitValue?: SubmitFunction;
  isInvalid?: boolean;
  defaultValue?: string;
}) {
  const element = elementInstance as CustomInstance;

  const [value, setValue] = useState<string>(defaultValue || "");
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    setError(isInvalid === true);
  }, [isInvalid]);

  const { label, required, placeHolder, helperText, rows } =
    element.extraAttributes;

  return (
    <div className="flex flex-col gap-2 w-full">
      <Textarea
        rows={rows}
        isInvalid={error}
        label={label}
        isRequired={required}
        placeholder={placeHolder}
        className="shadow-none"
        onChange={(e) => setValue(e.target.value)}
        onBlur={(e) => {
          if (!submitValue) return;

          const valid = TextAreaFieldFormElement.validate(
            element,
            e.target.value
          );
          setError(!valid);

          if (!valid) return;

          submitValue(element.id, e.target.value);
        }}
        value={value}
      />
      {helperText && (
        <p className="text-gray-600 text-[0.8rem]">{helperText}</p>
      )}
    </div>
  );
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
      label: element.extraAttributes.label,
      helperText: element.extraAttributes.helperText,
      required: element.extraAttributes.required,
      placeHolder: element.extraAttributes.placeHolder,
      rows: element.extraAttributes.rows,
    },
  });

  useEffect(() => {
    form.reset(element.extraAttributes);
  }, [element, form]);

  function applyChanges(values: propertiesSchemaType) {
    updateElement(element.id, {
      ...element,
      extraAttributes: {
        label: values.label,
        helperText: values.helperText,
        required: values.required,
        placeHolder: values.placeHolder,
        rows: values.rows,
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
          name="label"
          render={({ field, fieldState: { error } }) => (
            <Input
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              label="Label"
              {...field}
              errorMessage={error?.message}
              isInvalid={error ? true : false}
            />
          )}
        />
        <Controller
          control={form.control}
          name="placeHolder"
          render={({ field, fieldState: { error } }) => (
            <Input
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              label="Place holder"
              {...field}
              errorMessage={error?.message}
              isInvalid={error ? true : false}
            />
          )}
        />
        <Controller
          control={form.control}
          name="helperText"
          render={({ field, fieldState: { error } }) => (
            <Input
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              label="Helper text"
              {...field}
              errorMessage={error?.message}
              isInvalid={error ? true : false}
            />
          )}
        />
        <Controller
          control={form.control}
          name="rows"
          render={({ field }) => (
            <>
              <Slider
                defaultValue={[field.value]}
                minValue={1}
                maxValue={10}
                step={1}
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
                Número de filas: {field.value}
              </p>
            </>
          )}
        />
        <Controller
          control={form.control}
          name="required"
          render={({ field }) => (
            <div className="bg-[#f4f4f5] py-2 px-2 rounded-lg flex items-center justify-between">
              <h3>Is required?</h3>
              <Switch
                classNames={{
                  thumb: "bg-black",
                }}
                checked={field.value}
                onValueChange={field.onChange}
              />
            </div>
          )}
        />
      </form>
    </Form>
  );
}
