import { ReportFilters } from "@/types/reports";
import { ReportsContentWithTabs } from "@/modules/app/components/reports/ReportsContentWithTabs";
import {
  getReportsWithFilters,
  getArchivedReports,
  getClosedReports,
} from "@/actions/reports.actions";
import { auth } from "@clerk/nextjs/server";
import { resolveOrgId } from "@/modules/core/utils/org-resolver";
import { currentUser } from "@clerk/nextjs/server";
import {
  getUserRoleWithSuperAdmin,
  isSuperAdmin as checkSuperAdmin,
} from "@/modules/core/utils/permissions";
import { UserRole } from "@/types/auth.types";

interface ReportsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    severity?: string;
    source?: string;
    dateRange?: string;
    assignee?: string;
    page?: string;
    tab?: string;
    priority?: string;
    departmentId?: string;
    reportType?: string;
    anonymous?: string;
  }>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const { userId } = await auth();
  const orgId = await resolveOrgId();

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            No authenticated
          </h2>
          <p className="text-gray-600">Please sign in to access reports.</p>
        </div>
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            No organization selected
          </h2>
          <p className="text-gray-600">
            Please select an organization to continue.
          </p>
        </div>
      </div>
    );
  }

  // Get user details and role
  const clerkUser = await currentUser();
  const userEmail = clerkUser?.emailAddresses[0]?.emailAddress;
  const isSuperAdmin = userEmail ? checkSuperAdmin(userEmail) : false;

  // Get user role from database with super admin check
  const userRole = await getUserRoleWithSuperAdmin(userId, orgId, userEmail);

  const params = await searchParams;
  const {
    search,
    status,
    severity,
    source,
    dateRange,
    assignee,
    page,
    tab,
    priority,
    departmentId,
    reportType,
    anonymous,
  } = params;

  const filters: ReportFilters = {
    search: search || "",
    status: status || "all",
    severity: severity || "all",
    source: source || "all",
    dateRange: dateRange || "all",
    assignee: assignee || "all",
    priority: priority || "all",
    departmentId: departmentId || "all",
    reportType: reportType || "all",
    anonymous: anonymous || "all",
  };

  const currentPage = parseInt(page || "1", 10);
  const pageSize = 20;
  const activeTab = tab || "active"; // Default to active reports

  // For members, modify filters to only show their assigned reports
  let modifiedFilters = filters;
  if (userRole === UserRole.ORG_MEMBER && !isSuperAdmin) {
    modifiedFilters = {
      ...filters,
      assignee: "me", // Force to only show reports assigned to the current user
    };
  }

  // Load both active and archived reports
  const [activeReportsData, archivedReportsData] = await Promise.all([
    getReportsWithFilters(
      modifiedFilters,
      activeTab === "active" ? currentPage : 1,
      pageSize,
      userRole === UserRole.ORG_MEMBER ? userId : undefined
    ),
    getArchivedReports(
      modifiedFilters,
      activeTab === "archived" ? currentPage : 1,
      pageSize,
      userRole === UserRole.ORG_MEMBER ? userId : undefined
    ),
  ]);

  const closedReportsData = await getClosedReports(
    modifiedFilters,
    activeTab === "closed" ? currentPage : 1,
    pageSize,
    userRole === UserRole.ORG_MEMBER ? userId : undefined
  );

  return (
    <div className="p-6">
      <ReportsContentWithTabs
        activeReports={{
          reports: activeReportsData.reports,
          totalCount: activeReportsData.totalCount,
        }}
        archivedReports={{
          reports: archivedReportsData.reports,
          totalCount: archivedReportsData.totalCount,
        }}
        closedReports={{
          reports: closedReportsData.reports,
          totalCount: closedReportsData.totalCount,
        } as any}
        initialFilters={modifiedFilters}
        currentPage={currentPage}
        pageSize={pageSize}
        userRole={userRole}
        isSuperAdmin={isSuperAdmin}
        userId={userId}
        organizationId={orgId}
        activeTab={activeTab}
      />
    </div>
  );
}
