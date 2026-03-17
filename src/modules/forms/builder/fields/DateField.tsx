"use client";

import {
  Button,
  DatePicker,
  DateValue,
  Form,
  Input,
  Switch,
} from "@heroui/react";
import {
  ElementsType,
  FormElement,
  FormElementInstance,
  SubmitFunction,
} from "../components/FormElements";
import { parseDate } from "@internationalized/date";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useDesigner } from "../hooks/useDesigner";

const type: ElementsType = "DateField";

const extraAttributes = {
  label: "Campo de fecha",
  helperText: "Escoge una fecha",
  required: false,
};

const propertiesSchema = z.object({
  label: z.string().min(2).max(50),
  helperText: z.string().max(20),
  required: z.boolean().default(false).optional(),
});

type propertiesSchemaType = z.infer<typeof propertiesSchema>;

export const DateFieldFormElement: FormElement = {
  type,
  construct: (id: string) => ({
    id,
    type,
    extraAttributes,
  }),
  designerBtnElement: {
    icon: (
      <i className="icon-[uiw--date] size-8" role="img" aria-hidden="true" />
    ),
    label: "Campo de fecha",
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

  const { helperText } = element.extraAttributes;

  return (
    <div className="flex flex-col gap-2 w-full">
      <Button
        variant="bordered"
        className="w-full justify-start text-left font-normal"
        startContent={
          <i className="icon-[uiw--date]" role="img" aria-hidden="true" />
        }
      >
        <span>Pick a date</span>
      </Button>
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

  // Parse the default value from ISO string to DateValue
  const [date, setDate] = useState<DateValue | null>(() => {
    if (!defaultValue) return null;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return parseDate(defaultValue) as any;
    } catch (error) {
      console.error("Error parsing default date:", error);
      return null;
    }
  });

  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    setError(isInvalid === true);
  }, [isInvalid]);

  const { label, required, helperText } = element.extraAttributes;

  const handleDateChange = (newDate: DateValue | null) => {
    setDate(newDate);

    if (!submitValue) return;

    if (newDate) {
      // Convert DateValue to ISO string format: "2024-04-29"
      const year = newDate.year;
      const month = String(newDate.month).padStart(2, "0");
      const day = String(newDate.day).padStart(2, "0");
      const isoDate = `${year}-${month}-${day}`;

      submitValue(element.id, isoDate);
    } else {
      submitValue(element.id, "");
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <DatePicker
        label={label}
        value={(date as any) || undefined}
        isInvalid={error}
        isRequired={required}
        onChange={handleDateChange}
        errorMessage={error && required ? "Este campo es requerido" : undefined}
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
          name="required"
          render={({ field }) => (
            <div className="bg-[#f4f4f5] py-2 px-2 rounded-lg flex items-center justify-between">
              <h3>Is required?</h3>
              <Switch checked={field.value} onValueChange={field.onChange} />
            </div>
          )}
        />
      </form>
    </Form>
  );
}
