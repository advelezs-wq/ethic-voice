/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
} from "../lib/schemas/ethicline.schema";
import { UploadedAttachment } from "../components/AttachmentUploader";

// Define the form data type with proper structure
interface FormDataType {
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
  workRelationship: string;
  consultedBefore: string;
  consultationDetails?: string;
  irregularityType: string;
  questionnaire: {
    whatHappened: string;
    howItHappened: string;
    where: string;
    when: string;
    hasOtherInvolved: string;
    otherInvolved: string;
    additionalDetails: string;
    freeReport: string;
    "whatHappened_Uso indebido de recursos": boolean;
    "whatHappened_Conflicto de intereses": boolean;
    "whatHappened_Manipulación de información": boolean;
    "whatHappened_Abuso de autoridad": boolean;
    "whatHappened_Incumplimiento de políticas": boolean;
    "whatHappened_Conducta inapropiada": boolean;
    "whatHappened_Otro (especificar en detalles)": boolean;
    "howItHappened_De forma recurrente": boolean;
    "howItHappened_En una sola ocasión": boolean;
    "howItHappened_Durante reuniones laborales": boolean;
    "howItHappened_A través de comunicaciones electrónicas": boolean;
    "howItHappened_En horario laboral": boolean;
    "howItHappened_Fuera del horario laboral": boolean;
    "howItHappened_De forma encubierta": boolean;
    howItHappened_Abiertamente: boolean;
    [key: string]: string | boolean;
  };
  uploadedFiles: UploadedAttachment[];
  agreedToTerms: boolean;
}

export function useMultiStepForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Create a separate form instance for each step to avoid type conflicts
  const form = useForm<FormDataType>({
    defaultValues: {
      isAnonymous: false,
      reporter: {
        firstName: "",
        lastName: "",
        gender: "",
        email: "",
        idDocument: "",
        phone: "",
      },
      reported: {
        firstName: "",
        lastName: "",
        department: "",
        position: "",
      },
      workRelationship: "",
      consultedBefore: "",
      consultationDetails: "",
      irregularityType: "",
      questionnaire: {
        // String fields
        whatHappened: "",
        howItHappened: "",
        where: "",
        when: "",
        hasOtherInvolved: "",
        otherInvolved: "",
        additionalDetails: "",
        freeReport: "",
        // Boolean fields for checkboxes
        "whatHappened_Uso indebido de recursos": false,
        "whatHappened_Conflicto de intereses": false,
        "whatHappened_Manipulación de información": false,
        "whatHappened_Abuso de autoridad": false,
        "whatHappened_Incumplimiento de políticas": false,
        "whatHappened_Conducta inapropiada": false,
        "whatHappened_Otro (especificar en detalles)": false,
        "howItHappened_De forma recurrente": false,
        "howItHappened_En una sola ocasión": false,
        "howItHappened_Durante reuniones laborales": false,
        "howItHappened_A través de comunicaciones electrónicas": false,
        "howItHappened_En horario laboral": false,
        "howItHappened_Fuera del horario laboral": false,
        "howItHappened_De forma encubierta": false,
        howItHappened_Abiertamente: false,
      },
      uploadedFiles: [],
      agreedToTerms: false,
    },
    mode: "onChange",
  });

  // Watch for isAnonymous changes and clear reporter errors
  const isAnonymous = form.watch("isAnonymous");

  useEffect(() => {
    if (isAnonymous) {
      // Clear reporter field errors when anonymous is selected
      form.clearErrors([
        "reporter.firstName",
        "reporter.lastName",
        "reporter.gender",
        "reporter.email",
      ]);
    }
  }, [isAnonymous, form]);

  // Watch for consultedBefore changes and clear consultationDetails errors
  const consultedBefore = form.watch("consultedBefore");
  useEffect(() => {
    if (consultedBefore === "no") {
      // Clear consultation details when "no" is selected
      form.clearErrors(["consultationDetails"]);
      form.setValue("consultationDetails", "");
    }
  }, [consultedBefore, form]);

  const validateCurrentStep = async () => {
    const currentValues = form.getValues();
    const schema = getStepSchema(currentStep);

    try {
      // Extract only the fields relevant to the current step
      const stepData = getStepData(currentValues, currentStep);

      // Debug logging
      console.log(`Validating step ${currentStep}:`, stepData);

      // Use safeParse instead of parseAsync to avoid the _zod error
      const result = schema.safeParse(stepData);

      if (!result.success) {
        console.error(`Validation error in step ${currentStep}:`, result.error);

        // Set validation errors from Zod
        result.error.issues.forEach((err: any) => {
          const path = err.path.join(".");
          console.log(`Setting error for path: ${path}`, err.message);

          // Handle nested paths properly
          if (path) {
            form.setError(path as any, {
              type: "validation",
              message: err.message,
            });
          } else {
            // If no specific path, set a general error
            form.setError("root", {
              type: "validation",
              message: err.message,
            });
          }
        });

        return false;
      }

      // Clear any existing errors for this step
      const stepFields = getStepFields(currentStep);
      form.clearErrors(stepFields as any);

      return true;
    } catch (error: any) {
      console.error(`Unexpected error in step ${currentStep}:`, error);
      form.setError("root", {
        type: "validation",
        message:
          "Ha ocurrido un error inesperado. Por favor, intente nuevamente.",
      });
      return false;
    }
  };

  const nextStep = async () => {
    const isValid = await validateCurrentStep();

    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0); // Scroll to top when changing steps
      return true;
    }
    return false;
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0); // Scroll to top when changing steps
    }
  };

  return {
    currentStep,
    totalSteps,
    form,
    nextStep,
    previousStep,
    isFirstStep: currentStep === 1,
    isLastStep: currentStep === totalSteps,
    validateCurrentStep,
  };
}

function getStepSchema(step: number) {
  switch (step) {
    case 1:
      return step1Schema;
    case 2:
      return step2Schema;
    case 3:
      return step3Schema;
    case 4:
      return step4Schema;
    default:
      return step1Schema;
  }
}

function getStepFields(step: number): string[] {
  switch (step) {
    case 1:
      return ["isAnonymous", "reporter", "reported", "workRelationship", "consultedBefore", "consultationDetails"];
    case 2:
      return ["irregularityType"];
    case 3:
      return ["questionnaire"];
    case 4:
      return ["uploadedFiles", "agreedToTerms"];
    default:
      return [];
  }
}

function getStepData(formData: FormDataType, step: number) {
  switch (step) {
    case 1:
      return {
        isAnonymous: formData.isAnonymous,
        reporter: formData.reporter,
        reported: formData.reported,
        workRelationship: formData.workRelationship,
        consultedBefore: formData.consultedBefore,
        consultationDetails: formData.consultationDetails,
      };
    case 2:
      return {
        irregularityType: formData.irregularityType,
      };
    case 3:
      // Ensure questionnaire data is properly structured
      return {
        questionnaire: {
          ...formData.questionnaire,
          // Ensure all required fields exist with defaults
          whatHappened: formData.questionnaire?.whatHappened || "",
          howItHappened: formData.questionnaire?.howItHappened || "",
          where: formData.questionnaire?.where || "",
          when: formData.questionnaire?.when || "",
          hasOtherInvolved: formData.questionnaire?.hasOtherInvolved || "",
          otherInvolved: formData.questionnaire?.otherInvolved || "",
          additionalDetails: formData.questionnaire?.additionalDetails || "",
          freeReport: formData.questionnaire?.freeReport || "",
        },
      };
    case 4:
      return {
        uploadedFiles: formData.uploadedFiles || [],
        agreedToTerms: formData.agreedToTerms,
      };
    default:
      return {};
  }
}
