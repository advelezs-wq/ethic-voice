/** Utilidades compartidas del módulo de recursos descargables (lead magnets). */

export function sanitizeLeadMagnetSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}

export interface LeadMagnetFormFields {
  phone: boolean;
  company: boolean;
  role: boolean;
}

export function parseLeadMagnetFormFields(
  raw: unknown
): LeadMagnetFormFields {
  const obj = (raw ?? {}) as Record<string, unknown>;
  return {
    phone: obj.phone !== false,
    company: obj.company !== false,
    role: obj.role !== false,
  };
}
