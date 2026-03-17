/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useTransition } from "react";
import { FormProvider } from "react-hook-form";
import { Button } from "@heroui/button";
import { Card } from "@heroui/card";
import { Progress } from "@heroui/progress";

import { Step1Personal } from "./steps/Step1Personal";
import { Step2Type } from "./steps/Step2Type";
import { Step3Questions } from "./steps/Step3Questions";
import { Step4Evidence } from "./steps/Step4Evidence";
import { SubmissionSuccess } from "./SubmissionSuccess";
import { useMultiStepForm } from "../hooks/useMultiStepForm";
import {
  reconstructFormData,
  transformFormDataForSubmission,
} from "../utils/ethicline.utils";
import { submitEthicLineReport } from "@/actions/submission.actions";
import { addToast } from "@/modules/core/utils/safe-toast";
import { STEPS } from "../constants/ethicline.constants";
import { Organization } from "@prisma/client";

interface EthicLineFormProps {
  organization: Organization;
  onBack: () => void;
}

export function EthicLineForm({ organization, onBack }: EthicLineFormProps) {
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [trackingCode, setTrackingCode] = useState<string>("");

  const {
    currentStep,
    totalSteps,
    form,
    nextStep,
    previousStep,
    isFirstStep,
    isLastStep,
    validateCurrentStep,
  } = useMultiStepForm();

  const handleSubmit = async (data: any) => {
    if (!isLastStep) {
      const success = await nextStep();
      if (!success) {
        // Show error toast when validation fails
        addToast({
          title: "Error de validación",
          description: "Hay errores en el formulario, por favor revísalo",
          color: "danger",
        });
      }
      return;
    }

    // Validate final step before submission
    const isValid = await validateCurrentStep();
    if (!isValid) {
      addToast({
        title: "Error de validación",
        description: "Hay errores en el formulario, por favor revísalo",
        color: "danger",
      });
      return;
    }

    startTransition(async () => {
      try {
        // Check if data is flattened and needs reconstruction
        let processedData = data;

        // If questionnaire is not an object, we might have flattened data
        if (!data.questionnaire || typeof data.questionnaire !== "object") {
          processedData = reconstructFormData(data);
        }

        // Transform the data for submission
        const transformedData = transformFormDataForSubmission(processedData);

        const result = await submitEthicLineReport({
          organizationId: organization.id,
          formData: transformedData,
        });

        if (result.success && result.trackingCode) {
          setTrackingCode(result.trackingCode);
          setSubmitted(true);

          addToast({
            title: "Reporte enviado",
            description: "Tu reporte ha sido enviado exitosamente.",
            color: "success",
          });
        } else {
          throw new Error(result.error || "Error al enviar el reporte");
        }
      } catch (error) {
        console.error("Submission error:", error);
        addToast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "No se pudo enviar el reporte.",
          color: "danger",
        });
      }
    });
  };

  if (submitted && trackingCode) {
    return (
      <SubmissionSuccess
        trackingCode={trackingCode}
        isAnonymous={form.getValues("isAnonymous")}
      />
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Personal />;
      case 2:
        return <Step2Type />;
      case 3:
        return <Step3Questions />;
      case 4:
        return <Step4Evidence />;
      default:
        return null;
    }
  };

  return (
    <FormProvider {...form}>
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="light"
            startContent={
              <i
                className="icon-[lucide--chevron-left] size-4"
                role="img"
                aria-hidden="true"
              />
            }
            onPress={onBack}
            isDisabled={pending}
          >
            Volver
          </Button>

          <div className="mt-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {organization.name}
            </h1>
            <p className="text-gray-600">
              Paso {currentStep} de {totalSteps} - {STEPS[currentStep - 1]}
            </p>
          </div>

          <Progress
            value={(currentStep / totalSteps) * 100}
            color="primary"
            className="mt-4"
          />
        </div>

        <Card className="p-8">
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            {renderStep()}

            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="bordered"
                onPress={previousStep}
                isDisabled={isFirstStep || pending}
              >
                Anterior
              </Button>

              <Button type="submit" color="primary" isLoading={pending}>
                {isLastStep ? "Enviar Reporte" : "Continuar"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </FormProvider>
  );
}
