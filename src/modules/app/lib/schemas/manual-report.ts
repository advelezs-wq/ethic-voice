import { z } from "zod";

export const createManualReportSchema = z.object({
  reporterName: z.string().trim().optional(),
  reporterEmail: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      },
      { message: "Debe ser un email valido" }
    ),
  reporterPhone: z.string().trim().optional(),
  isAnonymous: z.boolean().default(false),
  channelType: z.enum(["phone", "whatsapp", "email", "in_person"]),
  title: z
    .string()
    .trim()
    .min(5, "El titulo debe tener al menos 5 caracteres")
    .max(120, "El titulo no puede superar 120 caracteres"),
  description: z
    .string()
    .trim()
    .min(20, "La descripcion debe tener al menos 20 caracteres")
    .max(5000, "La descripcion no puede superar 5000 caracteres"),
  irregularityType: z.string().trim().min(1, "Selecciona un tipo de irregularidad"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  location: z.string().trim().max(200, "La ubicacion no puede superar 200 caracteres").optional(),
  involvedPersons: z
    .string()
    .trim()
    .max(1000, "El campo de personas involucradas no puede superar 1000 caracteres")
    .optional(),
  evidenceDescription: z
    .string()
    .trim()
    .max(2000, "La descripcion de evidencias no puede superar 2000 caracteres")
    .optional(),
  adminNotes: z.string().trim().max(2000, "Las notas no pueden superar 2000 caracteres").optional(),
}).superRefine((data, ctx) => {
  if (!data.isAnonymous) {
    if (!data.reporterName || data.reporterName.length < 3) {
      ctx.addIssue({
        code: "custom",
        path: ["reporterName"],
        message: "El nombre del reportante es obligatorio (minimo 3 caracteres)",
      });
    }
    if (!data.reporterEmail) {
      ctx.addIssue({
        code: "custom",
        path: ["reporterEmail"],
        message: "El email del reportante es obligatorio",
      });
    }
  }
});

export type CreateManualReportData = z.infer<typeof createManualReportSchema>;
