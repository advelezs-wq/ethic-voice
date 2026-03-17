"use client";

import React, { useCallback, useRef, useState, useTransition } from "react";
import {
  FormElementInstance,
  FormElements,
} from "../builder/components/FormElements";
import { Button } from "@heroui/react";
import { addToast } from "@/modules/core/utils/safe-toast";
import { SubmitForm } from "@/actions/form";

export const FormSubmitComponent = ({
  formUrl,
  content,
}: {
  formUrl: string;
  content: FormElementInstance[];
}) => {
  const formValues = useRef<{ [key: string]: string }>({});
  const formErrors = useRef<{ [key: string]: boolean }>({});
  const [renderKey, setRenderKey] = useState(new Date().getTime());

  const [submitted, setSubmitted] = useState<boolean>(false);

  const [pending, startTransition] = useTransition();

  const validateForm: () => boolean = useCallback(() => {
    for (const field of content) {
      const actualValue = formValues.current[field.id] || "";
      const valid = FormElements[field.type].validate(field, actualValue);

      if (!valid) {
        formErrors.current[field.id] = true;
      }
    }

    if (Object.keys(formErrors.current).length > 0) {
      return false;
    }

    return true;
  }, [content]);

  const submitValue = useCallback((key: string, value: string) => {
    formValues.current[key] = value;
  }, []);

  const submitForm = async () => {
    formErrors.current = {};

    const validForm = validateForm();
    if (!validForm) {
      setRenderKey(new Date().getTime());
      addToast({
        title: "Error",
        description: "Por favor revisa el formulario",
        color: "danger",
      });
      return;
    }

    try {
      const JsonContent = JSON.stringify(formValues.current);
      await SubmitForm(formUrl, JsonContent);
      setSubmitted(true);
    } catch {
      addToast({
        title: "Error",
        description: "Algo salió mal",
        color: "danger",
      });
    }
  };

  if (submitted) {
    return (
      <div className="flex justify-center w-full h-full items-center p-8">
        <div className="max-w-[620px] flex flex-col gap-4 flex-grow bg-background w-full p-8 overflow-y-auto border shadow-xl rounded">
          <h1 className="text-2xl font-bold">Denuncia enviada</h1>
          <p className="text-gray-600">
            Gracias por tu reporte, ya puedes cerrar esta página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center w-full h-full items-center p-8">
      <div
        key={renderKey}
        className="max-w-[620px] flex flex-col gap-4 flex-grow bg-background w-full p-8 overflow-y-auto border shadow-xl rounded"
      >
        {content.map((element) => {
          const FormElement = FormElements[element.type].formComponent;
          return (
            <FormElement
              key={element.id}
              elementInstance={element}
              submitValue={submitValue}
              isInvalid={formErrors.current[element.id]}
              defaultValue={formValues.current[element.id]}
            />
          );
        })}
        <Button
          onPress={() => {
            startTransition(submitForm);
          }}
          className="mt-8 bg-black text-white"
          fullWidth
          isLoading={pending}
        >
          Submit
        </Button>
      </div>
    </div>
  );
};
