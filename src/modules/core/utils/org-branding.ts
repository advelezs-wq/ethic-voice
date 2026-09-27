/**
 * Marca del canal de denuncias (formulario público y seguimiento del caso).
 * El panel interno usa siempre la marca EthicVoice; la marca del cliente se
 * aplica donde la ven sus colaboradores, según su plan:
 *   Starter  → logo y nombre
 *   Grow     → + color de marca
 *   Grow Pro → + marca blanca (el canal no muestra la marca EthicVoice)
 *   Premium  → + dominio propio (p. ej. denuncias.empresa.com)
 */
import type { CSSProperties } from "react";
import { PLAN_CONFIGS, PlanType } from "@/types/subscription.types";

export type ChannelBranding = {
  orgName: string;
  slug: string;
  logoUrl: string | null;
  /** Color de marca (#RRGGBB) o null para usar el de EthicVoice. */
  accent: string | null;
  /** Texto legible sobre el color de marca. */
  accentForeground: string;
  whiteLabel: boolean;
  customDomain: string | null;
};

export type BrandingSource = {
  name: string;
  slug: string;
  logoUrl: string | null;
  currentPlan: PlanType | string | null;
  hasActivePlan: boolean;
  settings?: {
    logoUrl?: string | null;
    primaryColor?: string | null;
    brandingConfig?: unknown;
  } | null;
};

const HEX = /^#[0-9a-f]{6}$/i;
/** Valor que el sistema anterior guardaba por defecto: no es una elección del cliente. */
const LEGACY_DEFAULT_COLOR = "#0066cc";
export const DOMAIN_RE = /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

export function readableForeground(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.4 ? "#0B1D21" : "#FFFFFF";
}

export function brandingCapabilities(planType: PlanType | string | null, hasActivePlan: boolean) {
  const f = PLAN_CONFIGS[(planType as PlanType) || PlanType.STARTER]?.features ?? PLAN_CONFIGS.STARTER.features;
  return {
    logo: true,
    color: hasActivePlan && f.hasColorThemes,
    whiteLabel: hasActivePlan && f.hasUnlimitedCustomization,
    customDomain: hasActivePlan && planType === PlanType.PREMIUM,
  };
}

export function channelBranding(org: BrandingSource): ChannelBranding {
  const can = brandingCapabilities(org.currentPlan, org.hasActivePlan);
  const cfg = (org.settings?.brandingConfig && typeof org.settings.brandingConfig === "object"
    ? org.settings.brandingConfig
    : {}) as Record<string, unknown>;
  const color = String(org.settings?.primaryColor || "");
  const accent = can.color && HEX.test(color) && color.toLowerCase() !== LEGACY_DEFAULT_COLOR ? color.toUpperCase() : null;
  const domain = typeof cfg.customDomain === "string" && DOMAIN_RE.test(cfg.customDomain) ? cfg.customDomain.toLowerCase() : null;
  return {
    orgName: org.name,
    slug: org.slug,
    logoUrl: org.logoUrl || org.settings?.logoUrl || null,
    accent,
    accentForeground: accent ? readableForeground(accent) : "#FFFFFF",
    whiteLabel: can.whiteLabel && cfg.whiteLabel === true,
    customDomain: can.customDomain ? domain : null,
  };
}

/** Variables CSS que usan los botones y acentos del canal. */
export function brandingStyle(b: ChannelBranding | null): CSSProperties {
  if (!b?.accent) return {};
  return { ["--org-accent" as string]: b.accent, ["--org-accent-fg" as string]: b.accentForeground };
}
