"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormProvider } from "react-hook-form";
import { addToast } from "@/modules/core/utils/safe-toast";
import { Card } from "@heroui/card";
import { Button } from "@heroui/button";
import { Progress } from "@heroui/progress";
import { Organization } from "@prisma/client";
import { useMultiStepForm } from "../hooks/useMultiStepForm";
import { UploadedAttachment } from "./AttachmentUploader";
import { IntelligentCaptcha, useIntelligentCaptcha } from "@/modules/app/components/security/IntelligentCaptcha";

interface EthicLineSubmitComponentProps {
  organization: Organization;
  onBack: () => void;
}

export function EthicLineSubmitComponent({
  organization,
  onBack,
}: EthicLineSubmitComponentProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  const {
    currentStep,
    totalSteps,
    form,
    nextStep,
    previousStep,
    isFirstStep,
    isLastStep,
  } = useMultiStepForm();

  // Intelligent Captcha hook
  const {
    captchaToken,
    captchaRequired,
    captchaError,
    handleCaptchaVerify,
    handleCaptchaError,
    resetCaptcha,
    requireCaptcha,
  } = useIntelligentCaptcha();

  const handleSubmit = async () => {
    if (!isLastStep) {
      await nextStep();
      return;
    }

    // Final submission
    const formData = form.getValues();

    // Clean up the form data to match the expected schema
    const cleanedFormData: {
      isAnonymous: boolean;
      reporter: {
        firstName: string;
        lastName: string;
        gender: string;
        email: string;
        idDocument?: string;
        phone?: string;
      };
      reported: {
        firstName: string;
        lastName: string;
        department: string;
        position: string;
      };
      irregularityType: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      questionnaire: Record<string, any>;
      agreedToTerms: true;
      uploadedFiles: UploadedAttachment[];
    } = {
      ...formData,
      reporter: {
        firstName: formData.reporter.firstName || "",
        lastName: formData.reporter.lastName || "",
        gender: formData.reporter.gender || "",
        email: formData.reporter.email || "",
        idDocument: formData.reporter.idDocument || "",
        phone: formData.reporter.phone || "",
      },
      uploadedFiles: formData.uploadedFiles || [], // Use actual uploaded files
      agreedToTerms: true, // Ensure this is explicitly set to true
    };

    startTransition(async () => {
      try {
        const response = await fetch('/api/submit/secure', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            organizationId: organization.id,
            formData: cleanedFormData,
            captchaToken,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          if (result.requiresCaptcha) {
            requireCaptcha();
            addToast({
              title: "Verificación requerida",
              description: "Por favor completa la verificación de seguridad para continuar.",
              color: "warning",
            });
            return;
          }

          throw new Error(result.error || 'Error al enviar el reporte');
        }

        setSubmitted(true);
        resetCaptcha();

        addToast({
          title: "Reporte enviado",
          description:
            "Tu reporte ha sido enviado exitosamente y será procesado de manera confidencial.",
          color: "success",
        });

        // Redirect after 3 seconds
        setTimeout(() => {
          router.push("/");
        }, 3000);
      } catch {
        addToast({
          title: "Error",
          description:
            "No se pudo enviar el reporte. Por favor, intenta nuevamente.",
          color: "danger",
        });
      }
    });
  };

  if (submitted) {
    return (
      <div className="flex justify-center items-center min-h-[600px]">
        <Card className="max-w-md p-8 text-center">
          <i
            className="icon-[material-symbols--check-circle-rounded] size-16 text-green-500 mx-auto mb-4"
            role="img"
            aria-hidden="true"
          />
          <h2 className="text-2xl font-bold mb-2">¡Reporte Enviado!</h2>
          <p className="text-gray-600 mb-6">
            Gracias por tu reporte. Ha sido recibido y será procesado de manera
            confidencial.
          </p>
          <p className="text-sm text-gray-500">
            Serás redirigido en unos segundos...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <FormProvider {...form}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {organization.name}
              </h1>
              <p className="text-gray-600">
                Paso {currentStep} de {totalSteps}
              </p>
            </div>
            <Button variant="light" onPress={onBack} isDisabled={pending}>
              Cancelar
            </Button>
          </div>

          <Progress
            value={(currentStep / totalSteps) * 100}
            color="primary"
            className="mb-2"
          />
        </div>

        {/* Form */}
        <Card className="p-8">
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            {/* Intelligent Captcha - shows only when needed */}
            {(captchaRequired || captchaError) && (
              <div className="mb-6">
                <IntelligentCaptcha
                  siteKey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || ""}
                  onVerify={handleCaptchaVerify}
                  onError={handleCaptchaError}
                  required={captchaRequired}
                />
                {captchaError && (
                  <p className="text-sm text-red-600 mt-2">
                    Error en la verificación: {captchaError}
                  </p>
                )}
              </div>
            )}

            {/* Navigation */}
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
