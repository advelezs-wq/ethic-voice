import prisma from "@/modules/prisma/lib/prisma";
import { channelBranding, type ChannelBranding } from "@/modules/core/utils/org-branding";

const brandingSelect = {
  name: true,
  slug: true,
  logoUrl: true,
  currentPlan: true,
  hasActivePlan: true,
  settings: { select: { logoUrl: true, primaryColor: true, brandingConfig: true } },
} as const;

export async function getChannelBrandingByOrgId(orgId: string | null | undefined): Promise<ChannelBranding | null> {
  if (!orgId) return null;
  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: brandingSelect });
  return org ? channelBranding(org) : null;
}

/** Organización cuyo dominio propio (Premium) es este host, si existe. */
export async function findOrgByCustomDomain(host: string) {
  const domain = host.toLowerCase().replace(/:\d+$/, "");
  const rows = await prisma.organizationSettings.findMany({
    where: { brandingConfig: { path: ["customDomain"], equals: domain } },
    select: { organization: { select: { id: true, ...brandingSelect, isActive: true } } },
  });
  for (const r of rows) {
    const b = r.organization.isActive ? channelBranding(r.organization) : null;
    if (b?.customDomain === domain) return { id: r.organization.id, slug: r.organization.slug };
  }
  return null;
}
