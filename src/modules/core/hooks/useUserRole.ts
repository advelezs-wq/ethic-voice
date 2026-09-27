"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { UserRole, RoleContext } from "@/types/auth.types";
import { getRolePermissions, isSuperAdmin } from "../utils/permissions";
import { useOrganization } from "@/modules/app/hooks/useOrganization";

// Una sola petición por (usuario, organización), compartida entre todos los
// componentes que usan el hook (menú, header, página), y recordada durante la
// sesión. Antes cada instancia pedía los permisos por separado y, si tardaban
// más de 6 s, mostraba la vista de investigador por defecto.
type CachedRole = { role: UserRole; permissions: RoleContext["permissions"] };
const inflight = new Map<string, Promise<CachedRole | null>>();
const memoryCache = new Map<string, CachedRole>();

function readCache(key: string): CachedRole | null {
  const mem = memoryCache.get(key);
  if (mem) return mem;
  try {
    const raw = sessionStorage.getItem(`ev_role:${key}`);
    if (raw) {
      const parsed = JSON.parse(raw) as CachedRole;
      memoryCache.set(key, parsed);
      return parsed;
    }
  } catch {}
  return null;
}

function writeCache(key: string, value: CachedRole) {
  memoryCache.set(key, value);
  try {
    sessionStorage.setItem(`ev_role:${key}`, JSON.stringify(value));
  } catch {}
}

function fetchRole(orgId: string, key: string): Promise<CachedRole | null> {
  const existing = inflight.get(key);
  if (existing) return existing;
  const p = fetch(`/api/organization/${orgId}/my-permissions`, { cache: "no-store" })
    .then(async (res) => {
      if (!res.ok) return null;
      const data = await res.json();
      const value: CachedRole = {
        role: data.role as UserRole,
        permissions: data.permissions || getRolePermissions(UserRole.ORG_MEMBER),
      };
      writeCache(key, value);
      return value;
    })
    .catch(() => null)
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

export function useUserRole(): RoleContext & { isLoading: boolean } {
  const { user, isLoaded: userLoaded } = useUser();
  const { currentOrganization, isLoading: orgLoading } = useOrganization();
  const [roleContext, setRoleContext] = useState<RoleContext>({
    role: UserRole.ORG_MEMBER,
    permissions: getRolePermissions(UserRole.ORG_MEMBER),
    isSuperAdmin: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userLoaded || orgLoading) {
      setIsLoading(true);
      return;
    }

    // Check if user is super admin
    const userEmail = user?.primaryEmailAddress?.emailAddress;
    if (userEmail && isSuperAdmin(userEmail)) {
      setRoleContext({
        role: UserRole.SUPER_ADMIN,
        permissions: getRolePermissions(UserRole.SUPER_ADMIN),
        isSuperAdmin: true,
      });
      setIsLoading(false);
      return;
    }

    // Resolve from DB for current organization
    let cancelled = false;
    (async () => {
      try {
        const orgId = currentOrganization?.id;
        if (!orgId) {
          setRoleContext({
            role: UserRole.ORG_MEMBER,
            permissions: getRolePermissions(UserRole.ORG_MEMBER),
            isSuperAdmin: false,
          });
          if (!cancelled) setIsLoading(false);
          return;
        }

        const key = `${user?.id ?? "anon"}:${orgId}`;
        const cached = readCache(key);
        if (cached) {
          setRoleContext({ ...cached, isSuperAdmin: false });
          if (!cancelled) setIsLoading(false);
        }
        const fresh = await fetchRole(orgId, key);
        if (cancelled) return;
        if (fresh) {
          setRoleContext({ ...fresh, isSuperAdmin: false });
        } else if (!cached) {
          setRoleContext({
            role: UserRole.ORG_MEMBER,
            permissions: getRolePermissions(UserRole.ORG_MEMBER),
            isSuperAdmin: false,
          });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    // Salvaguarda: si la respuesta nunca llega, no bloquear la interfaz para
    // siempre (queda con permisos mínimos, que es lo seguro).
    const t = setTimeout(() => {
      if (!cancelled) setIsLoading(false);
    }, 20000);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [user, userLoaded, currentOrganization?.id, orgLoading]);

  return {
    ...roleContext,
    isLoading,
  };
}
