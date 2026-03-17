import { UserRole, UserPermissions } from "@/types/auth.types";
import prisma from "@/modules/prisma/lib/prisma";

export const getRolePermissions = (role: UserRole): UserPermissions => {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return {
        canViewAllOrganizations: true,
        canCreateOrganization: true,
        canViewAllReports: true,
        canAssignReports: true,
        canEditReports: true,
        canViewAssignedReports: true,
        canManageOrganization: true,
        canInviteMembers: true,
        canViewOrganizationStats: true,
        canViewTeamStats: true,
      };
    case UserRole.ORG_ADMIN:
      return {
        canViewAllOrganizations: false,
        canCreateOrganization: false,
        canViewAllReports: true,
        canAssignReports: true,
        canEditReports: true,
        canViewAssignedReports: true,
        canManageOrganization: true,
        canInviteMembers: true,
        canViewOrganizationStats: true,
        canViewTeamStats: true,
      };
    case UserRole.ORG_MEMBER:
      return {
        canViewAllOrganizations: false,
        canCreateOrganization: false,
        canViewAllReports: false,
        canAssignReports: false,
        canEditReports: false,
        canViewAssignedReports: true,
        canManageOrganization: false,
        canInviteMembers: false,
        canViewOrganizationStats: false,
        canViewTeamStats: true,
      };
    default:
      return {
        canViewAllOrganizations: false,
        canCreateOrganization: false,
        canViewAllReports: false,
        canAssignReports: false,
        canEditReports: false,
        canViewAssignedReports: false,
        canManageOrganization: false,
        canInviteMembers: false,
        canViewOrganizationStats: false,
        canViewTeamStats: false,
      };
  }
};

export const isSuperAdmin = (email: string): boolean => {
  const superAdminEmails =
    process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS?.split(",") || [];

  // For debugging
  console.log("🔍 [SUPER-ADMIN-CHECK] Email to check:", email);
  console.log(
    "🔍 [SUPER-ADMIN-CHECK] Super admin emails from env:",
    superAdminEmails
  );
  console.log(
    "🔍 [SUPER-ADMIN-CHECK] Environment variable exists:",
    !!process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS
  );

  const result = superAdminEmails.includes(email);
  console.log("🔍 [SUPER-ADMIN-CHECK] Result:", result);

  return result;
};

// NEW FUNCTION: Get user role from database
export async function getUserRole(
  userId: string,
  orgId: string
): Promise<UserRole> {
  try {
    // Check if user is super admin first (based on email)
    // Note: You might need to get user email here if needed for super admin check

    // Check organization membership
    const membership = await prisma.organizationMembership.findUnique({
      where: {
        userId_orgId: {
          userId,
          orgId,
        },
      },
    });

    if (!membership) {
      // First, verify the organization exists
      const organization = await prisma.organization.findUnique({
        where: { id: orgId },
      });

      if (!organization) {
        console.error(`Organization ${orgId} does not exist`);
        throw new Error(`Organization ${orgId} not found`);
      }

      // If no membership exists but org exists, create one as MEMBER by default
      await prisma.organizationMembership.create({
        data: {
          userId,
          orgId,
          role: "MEMBER",
        },
      });
      return UserRole.ORG_MEMBER;
    }

    // Map Prisma enum to your UserRole enum
    switch (membership.role) {
      case "ADMIN":
        return UserRole.ORG_ADMIN;
      case "MEMBER":
        return UserRole.ORG_MEMBER;
      default:
        return UserRole.ORG_MEMBER;
    }
  } catch (error) {
    console.error("Error getting user role:", error);
    // Default to member role if there's an error
    return UserRole.ORG_MEMBER;
  }
}

// Alternative function that includes super admin check
export async function getUserRoleWithSuperAdmin(
  userId: string,
  orgId: string,
  userEmail?: string
): Promise<UserRole> {
  try {
    // Check if user is super admin first
    if (userEmail && isSuperAdmin(userEmail)) {
      return UserRole.SUPER_ADMIN;
    }

    // Get organization role
    return await getUserRole(userId, orgId);
  } catch (error) {
    console.error("Error getting user role with super admin check:", error);
    return UserRole.ORG_MEMBER;
  }
}

// Utility function to check if user has specific permission
export async function userHasPermission(
  userId: string,
  orgId: string,
  permission: keyof UserPermissions,
  userEmail?: string
): Promise<boolean> {
  try {
    const role = await getUserRoleWithSuperAdmin(userId, orgId, userEmail);
    const permissions = getRolePermissions(role);
    return permissions[permission];
  } catch (error) {
    console.error("Error checking user permission:", error);
    return false; // Default to no permission if there's an error
  }
}

// Utility function to get user permissions
export async function getUserPermissions(
  userId: string,
  orgId: string,
  userEmail?: string
): Promise<UserPermissions> {
  try {
    const role = await getUserRoleWithSuperAdmin(userId, orgId, userEmail);
    return getRolePermissions(role);
  } catch (error) {
    console.error("Error getting user permissions:", error);
    return getRolePermissions(UserRole.ORG_MEMBER); // Default to member permissions
  }
}
