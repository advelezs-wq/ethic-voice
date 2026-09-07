// lib/schemas/ethics-context.ts
import { z } from "zod";

export const governanceEntrySchema = z.object({
  role: z.string().min(1, "El rol/comité es requerido"),
  detail: z.string().min(1, "El detalle es requerido"),
});

export const specialCriterionSchema = z.object({
  label: z.string().min(1, "El criterio es requerido"),
  active: z.boolean().default(true),
});

export const ethicalContextSchema = z.object({
  businessContext: z.string().max(4000).optional().default(""),
  governanceStructure: z.array(governanceEntrySchema).default([]),
  specialCriteria: z.array(specialCriterionSchema).default([]),
});

export type GovernanceEntry = z.infer<typeof governanceEntrySchema>;
export type SpecialCriterion = z.infer<typeof specialCriterionSchema>;
export type EthicalContextInput = z.infer<typeof ethicalContextSchema>;

export const EthicalDocumentTypeValues = [
  "CODIGO_ETICA",
  "REGLAMENTO_INTERNO",
  "ANTICORRUPCION",
  "COMPRAS",
  "GASTOS_VIAJE",
  "REGALOS",
  "CONFLICTO_INTERES",
  "OTRO",
] as const;

export const ethicalDocumentUploadSchema = z.object({
  documentType: z.enum(EthicalDocumentTypeValues).default("OTRO"),
  version: z.string().min(1, "La versión es requerida").default("1.0"),
});

export type EthicalDocumentUploadInput = z.infer<
  typeof ethicalDocumentUploadSchema
>;
