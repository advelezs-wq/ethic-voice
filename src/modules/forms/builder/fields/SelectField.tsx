"use client";

import {
  // addToast, // Now using safe-toast
  Button,
  Divider,
  Form,
  Input,
  Select,
  SelectItem,
  Switch,
} from "@heroui/react";
import { addToast } from "@/modules/core/utils/safe-toast";
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

const type: ElementsType = "SelectField";

const extraAttributes = {
  label: "Campo de selección",
  helperText: "Helper text",
  required: false,
  placeHolder: "Value here...",
  options: [],
};

const propertiesSchema = z.object({
  label: z.string().min(2).max(50),
  helperText: z.string().max(20),
  required: z.boolean().default(false).optional(),
  placeHolder: z.string().max(50),
  options: z.array(z.string()).default([]).optional(),
});

type propertiesSchemaType = z.infer<typeof propertiesSchema>;

export const SelectFieldFormElement: FormElement = {
  type,
  construct: (id: string) => ({
    id,
    type,
    extraAttributes,
  }),
  designerBtnElement: {
    icon: (
      <i className="icon-[f7--menu] size-8" role="img" aria-hidden="true" />
    ),
    label: "Campo de selección",
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
      <Select label={label} isRequired={required} placeholder={placeHolder}>
        <SelectItem key={placeHolder}>{placeHolder}</SelectItem>
      </Select>
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

  const { label, required, placeHolder, helperText, options } =
    element.extraAttributes;

  return (
    <div className="flex flex-col gap-2 w-full">
      <Select
        label={label}
        isRequired={required}
        placeholder={placeHolder}
        value={[value]}
        onChange={(e) => {
          const value = e.target.value;
          setValue(value);

          if (!submitValue) return;
          const valid = SelectFieldFormElement.validate(element, value);
          setError(!valid);
          submitValue(element.id, value);
        }}
        isInvalid={error}
      >
        {options.map((option) => (
          <SelectItem key={option}>{option}</SelectItem>
        ))}
      </Select>
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

  const { updateElement, setSelectedElement } = useDesigner();

  const form = useForm<propertiesSchemaType>({
    resolver: zodResolver(propertiesSchema),
    mode: "onSubmit",
    defaultValues: {
      label: element.extraAttributes.label,
      helperText: element.extraAttributes.helperText,
      required: element.extraAttributes.required,
      placeHolder: element.extraAttributes.placeHolder,
      options: element.extraAttributes.options,
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
        options: values.options,
      },
    });

    addToast({
      title: "Guardado!",
      description: "Propiedades guardadas",
      color: "success",
    });

    setSelectedElement(null);
  }

  return (
    <Form {...form}>
      <form className="space-y-3 w-full">
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
        <Divider />
        <Controller
          control={form.control}
          name="options"
          render={({ field }) => (
            <>
              <div className="flex justify-between items-center">
                <p>Options</p>
                <Button
                  variant="light"
                  startContent={
                    <i
                      className="icon-[mdi--plus]"
                      role="img"
                      aria-hidden="true"
                    />
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    form.setValue("options", field.value?.concat("New option"));
                  }}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                {form.watch("options")?.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-1"
                  >
                    <Input
                      placeholder=""
                      value={option}
                      onChange={(e) => {
                        field.value![index] = e.target.value;
                        field.onChange(field.value);
                      }}
                    />
                    <Button
                      variant="solid"
                      className="bg-red-400 text-white"
                      isIconOnly
                      onClick={(e) => {
                        e.preventDefault();
                        const newOptions = [...field.value!];
                        newOptions.splice(index, 1);
                        field.onChange(newOptions);
                      }}
                    >
                      <i
                        className="icon-[material-symbols--close]"
                        role="img"
                        aria-hidden="true"
                      />
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        />
        <Divider />
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
        <Divider />
        <Button
          fullWidth
          className="w-full bg-black text-white"
          onClick={form.handleSubmit(applyChanges)}
        >
          Save
        </Button>
      </form>
    </Form>
  );
}
