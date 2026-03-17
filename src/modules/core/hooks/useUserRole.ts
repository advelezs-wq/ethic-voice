"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { UserRole, RoleContext } from "@/types/auth.types";
import { getRolePermissions, isSuperAdmin } from "../utils/permissions";
import { useOrganization } from "@/modules/app/hooks/useOrganization";

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

        const res = await fetch(`/api/organization/${orgId}/my-permissions`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setRoleContext({
            role: data.role as UserRole,
            permissions: data.permissions || getRolePermissions(UserRole.ORG_MEMBER),
            isSuperAdmin: false,
          });
        } else {
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

    // Safety timeout so UI never hangs
    const t = setTimeout(() => {
      if (!cancelled) setIsLoading(false);
    }, 6000);

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
