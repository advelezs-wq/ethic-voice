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
import { addToast } from "@/modules/core/utils/safe-toast";
import { STEPS } from "../constants/ethicline.constants";
import { Organization } from "@prisma/client";
import {
  IntelligentCaptcha,
  useIntelligentCaptcha,
} from "@/modules/app/components/security/IntelligentCaptcha";

interface EthicLineFormProps {
  organization: Organization;
  onBack: () => void;
}

export function EthicLineForm({ organization, onBack }: EthicLineFormProps) {
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [trackingCode, setTrackingCode] = useState<string>("");
  const [idempotencyKey] = useState(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `submit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  );
  const {
    captchaToken,
    captchaRequired,
    captchaError,
    handleCaptchaVerify,
    handleCaptchaError,
    resetCaptcha,
    requireCaptcha,
  } = useIntelligentCaptcha();

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

        const response = await fetch("/api/submit/secure", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-idempotency-key": idempotencyKey,
          },
          body: JSON.stringify({
            organizationId: organization.id,
            formData: transformedData,
            captchaToken,
            idempotencyKey,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          if (result?.requiresCaptcha) {
            requireCaptcha();
            addToast({
              title: "Verificación requerida",
              description:
                "Completa la verificación de seguridad para continuar.",
              color: "warning",
            });
            return;
          }

          throw new Error(result?.error || "Error al enviar el reporte");
        }

        if (result.success && result.trackingCode) {
          setTrackingCode(result.trackingCode);
          setSubmitted(true);
          resetCaptcha();

          addToast({
            title: "Reporte enviado",
            description: "Tu reporte ha sido enviado exitosamente.",
            color: "success",
          });
        } else {
          throw new Error(result?.error || "Error al enviar el reporte");
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
      <div className="container mx-auto max-w-5xl px-4 py-8 md:py-10">
        <div className="mb-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-[#0a1e14]/10 bg-white/80 p-3 text-sm text-[#0d212c]">
            <p className="mb-1 font-semibold text-[#0a1e14]">Confidencial</p>
            <p className="text-xs text-[#273c46]">
              Solo personal autorizado accede al caso.
            </p>
          </div>
          <div className="rounded-xl border border-[#0a1e14]/10 bg-white/80 p-3 text-sm text-[#0d212c]">
            <p className="mb-1 font-semibold text-[#0a1e14]">
              Protección de identidad
            </p>
            <p className="text-xs text-[#273c46]">
              Puedes denunciar de forma anónima.
            </p>
          </div>
          <div className="rounded-xl border border-[#0a1e14]/10 bg-white/80 p-3 text-sm text-[#0d212c]">
            <p className="mb-1 font-semibold text-[#0a1e14]">Integridad del reporte</p>
            <p className="text-xs text-[#273c46]">
              Validamos campos clave antes del envío.
            </p>
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-[#0a1e14]/10 bg-white/90 p-5 shadow-[0_18px_55px_rgba(10,30,20,0.08)] md:p-7">
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
            className="text-[#0d212c]"
          >
            Volver
          </Button>

          <div className="mt-4">
            <h1 className="text-2xl font-bold text-[#0a1e14]">
              {organization.name}
            </h1>
            <p className="text-[#273c46]">
              Paso {currentStep} de {totalSteps} - {STEPS[currentStep - 1]}
            </p>
          </div>

          <Progress
            value={(currentStep / totalSteps) * 100}
            color="primary"
            className="mt-4"
            classNames={{
              track: "bg-[#e6efe9]",
              indicator: "bg-[#0a1e14]",
            }}
          />
        </div>

        <Card className="rounded-3xl border border-[#0a1e14]/10 bg-white/95 p-6 shadow-[0_20px_60px_rgba(10,30,20,0.1)] md:p-8">
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            {(captchaRequired || captchaError) && (
              <div className="mb-6">
                <IntelligentCaptcha
                  siteKey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || ""}
                  onVerify={handleCaptchaVerify}
                  onError={handleCaptchaError}
                  required={captchaRequired}
                />
                {captchaError && (
                  <p className="mt-2 text-sm text-red-600">
                    Error en la verificación: {captchaError}
                  </p>
                )}
              </div>
            )}

            {renderStep()}

            <div className="mt-8 flex justify-between">
              <Button
                type="button"
                variant="bordered"
                onPress={previousStep}
                isDisabled={isFirstStep || pending}
                className="border-[#0a1e14]/30 text-[#0d212c]"
              >
                Anterior
              </Button>

              <Button
                type="submit"
                color="primary"
                isLoading={pending}
                className="bg-[#0a1e14] text-white data-[hover=true]:!bg-[#0f3423]"
              >
                {isLastStep ? "Enviar Reporte" : "Continuar"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </FormProvider>
  );
}
