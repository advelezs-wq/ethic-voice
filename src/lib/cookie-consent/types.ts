/** Incrementar cuando cambien categorías o textos legales → se vuelve a pedir consentimiento */
export const CONSENT_POLICY_VERSION = 1;

export const CONSENT_STORAGE_KEY = "ethicvoice_cookie_consent_v1";

export type ConsentSource = "all" | "essential" | "custom";

export type ConsentCategories = {
  /** Siempre activo (sesión, seguridad, rebill en checkout, etc.) */
  necessary: true;
  /** Preferencias de UI, idioma, widgets no publicitarios */
  functional: boolean;
  /** Medición: GA4, Clarity, estadísticas agregadas */
  analytics: boolean;
  /** Remarketing / píxeles publicitarios */
  marketing: boolean;
  /**
   * CCPA / CPRA: el usuario ejerce el derecho a optar por no vender ni compartir
   * datos personales con fines publicitarios (limita carga de marketing).
   */
  saleOptOut: boolean;
};

export type ConsentRecord = ConsentCategories & {
  policyVersion: number;
  updatedAt: string;
  source: ConsentSource;
};

export const DEFAULT_CONSENT: ConsentRecord = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
  saleOptOut: false,
  policyVersion: CONSENT_POLICY_VERSION,
  updatedAt: "",
  source: "essential",
};

export function effectiveMarketingAllowed(c: ConsentCategories): boolean {
  return c.marketing && !c.saleOptOut;
}
