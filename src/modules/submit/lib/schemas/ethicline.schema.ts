// lib/schemas/ethicline.schema.ts
import { z } from "zod";

const reporterSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  gender: z.string(),
  email: z.string(),
  idDocument: z.string().optional(),
  phone: z.string().optional(),
});

const reportedSchema = z.object({
  firstName: z.string().min(1, "Nombre del denunciado es requerido"),
  lastName: z.string().min(1, "Apellido del denunciado es requerido"),
  department: z.string().min(1, "Departamento es requerido"),
  position: z.string().min(1, "Cargo es requerido"),
});

// More structured questionnaire schema
const questionnaireSchema = z
  .object({
    // String fields
    whatHappened: z.string().default(""),
    howItHappened: z.string().default(""),
    where: z.string().default(""),
    when: z.string().default(""),
    hasOtherInvolved: z.string().default(""),
    otherInvolved: z.string().default(""),
    additionalDetails: z.string().default(""),
    freeReport: z.string().default(""),

    // Boolean fields for checkboxes - whatHappened options
    "whatHappened_Uso indebido de recursos": z.boolean().default(false),
    "whatHappened_Conflicto de intereses": z.boolean().default(false),
    "whatHappened_Manipulación de información": z.boolean().default(false),
    "whatHappened_Abuso de autoridad": z.boolean().default(false),
    "whatHappened_Incumplimiento de políticas": z.boolean().default(false),
    "whatHappened_Conducta inapropiada": z.boolean().default(false),
    "whatHappened_Otro (especificar en detalles)": z.boolean().default(false),

    // Boolean fields for checkboxes - howItHappened options
    "howItHappened_De forma recurrente": z.boolean().default(false),
    "howItHappened_En una sola ocasión": z.boolean().default(false),
    "howItHappened_Durante reuniones laborales": z.boolean().default(false),
    "howItHappened_A través de comunicaciones electrónicas": z
      .boolean()
      .default(false),
    "howItHappened_En horario laboral": z.boolean().default(false),
    "howItHappened_Fuera del horario laboral": z.boolean().default(false),
    "howItHappened_De forma encubierta": z.boolean().default(false),
    howItHappened_Abiertamente: z.boolean().default(false),
  })
  .catchall(z.union([z.string(), z.boolean(), z.undefined(), z.null()])); // Allow additional fields

export const step1Schema = z
  .object({
    isAnonymous: z.boolean(),
    reporter: reporterSchema,
    reported: reportedSchema,
    workRelationship: z.string().min(1, "Relación laboral es requerida"),
    consultedBefore: z
      .string()
      .min(1, "Debe indicar si consultó antes con alguien"),
    consultationDetails: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Only validate reporter fields if not anonymous
    if (!data.isAnonymous) {
      if (!data.reporter.firstName || data.reporter.firstName.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Nombre es requerido",
          path: ["reporter", "firstName"],
        });
      }
      if (!data.reporter.lastName || data.reporter.lastName.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Apellido es requerido",
          path: ["reporter", "lastName"],
        });
      }
      if (!data.reporter.gender || data.reporter.gender.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Género es requerido",
          path: ["reporter", "gender"],
        });
      }
      if (
        !data.reporter.email ||
        !z.string().email().safeParse(data.reporter.email).success
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Email válido es requerido",
          path: ["reporter", "email"],
        });
      }
    }

    // Validate consultation details if consulted before is "si"
    if (data.consultedBefore === "si") {
      if (
        !data.consultationDetails ||
        data.consultationDetails.trim().length < 1
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Debe proporcionar detalles sobre con quién consultó y qué respuesta recibió",
          path: ["consultationDetails"],
        });
      }
    }
  });

export const step2Schema = z.object({
  irregularityType: z
    .string()
    .min(1, "Debe seleccionar un tipo de irregularidad"),
});

// Step 3 schema with custom validation for required fields
export const step3Schema = z.object({
  questionnaire: questionnaireSchema.superRefine((data, ctx) => {
    // Check if it's a free report
    const isFreeReport = data.freeReport && data.freeReport.length > 0;

    if (isFreeReport) {
      // For free reports, only require the freeReport field
      if (!data.freeReport || data.freeReport.trim().length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La descripción debe tener al menos 10 caracteres",
          path: ["freeReport"],
        });
      }
      return; // Exit early for free reports
    }

    // For structured reports, check required fields
    const hasWhatHappenedChecked = Object.keys(data).some(
      (key) => key.startsWith("whatHappened_") && data[key] === true
    );

    const hasHowItHappenedChecked = Object.keys(data).some(
      (key) => key.startsWith("howItHappened_") && data[key] === true
    );

    const hasWhere = data.where && data.where.length > 0;
    const hasWhen = data.when && data.when.length > 0;

    if (!hasWhatHappenedChecked) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debe seleccionar al menos una opción de qué pasó",
        path: ["whatHappened"],
      });
    }

    if (!hasHowItHappenedChecked) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debe seleccionar al menos una opción de cómo pasó",
        path: ["howItHappened"],
      });
    }

    if (!hasWhere) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debe seleccionar dónde sucedió",
        path: ["where"],
      });
    }

    if (!hasWhen) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debe seleccionar cuándo sucedió",
        path: ["when"],
      });
    }
  }),
});

const attachmentSchema = z.object({
  filename: z.string(),
  fileUrl: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  cloudinaryPublicId: z.string().optional(),
});

export const step4Schema = z.object({
  uploadedFiles: z.array(attachmentSchema).optional(),
  agreedToTerms: z.literal(true).refine((val) => val === true, {
    message: "Debe aceptar los términos",
  }),
});

export const completeFormSchema = z.object({
  isAnonymous: z.boolean(),
  reporter: reporterSchema,
  reported: reportedSchema,
  workRelationship: z.string(),
  consultedBefore: z.string(),
  consultationDetails: z.string().optional(),
  irregularityType: z.string(),
  questionnaire: questionnaireSchema,
  uploadedFiles: z.array(attachmentSchema).default([]),
  agreedToTerms: z.boolean(),
});

export type CompleteFormData = z.infer<typeof completeFormSchema>;
