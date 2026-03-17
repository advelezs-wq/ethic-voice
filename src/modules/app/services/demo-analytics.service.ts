import type {
  DashboardData,
  DashboardStats,
  Report,
  ChartDataPoint,
  CategoryData,
  DepartmentData,
} from "@/types/dashboard.types";

// Demo data generator for platform screenshots
export function generateDemoDashboardData(orgId: string): DashboardData {
  // const now = new Date();
  // const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Generate realistic stats
  const stats: DashboardStats = {
    totalReports: 247,
    newReports: 23,
    inProgress: 18,
    closedReports: 206,
    percentageChange: 12.5,
    anonymousReports: 34,
    averageResolutionTime: 4.2,
    criticalReports: 8,
  };

  // Generate recent reports
  const recentReports: Report[] = [
    {
      idTable: 1,
      id: "RPT-2024-001",
      subject: "Violación de políticas de seguridad",
      category: "Seguridad",
      severity: "HIGH",
      deadline: "2024-01-15",
      status: "progress",
      content: {
        description:
          "Reporte de posible violación de políticas de seguridad...",
      },
      submittedAt: new Date(2024, 0, 10, 14, 30),
      source: "ETHIC_LINE",
      isAnonymous: true,
      department: "Tecnología",
      assignments: [{ userId: "user1", userName: "María González" }],
    },
    {
      idTable: 2,
      id: "RPT-2024-002",
      subject: "Discriminación en el trabajo",
      category: "Recursos Humanos",
      severity: "HIGH",
      deadline: "2024-01-20",
      status: "new",
      content: {
        description: "Allegación de discriminación en el ambiente laboral...",
      },
      submittedAt: new Date(2024, 0, 12, 9, 15),
      source: "CUSTOM_FORM",
      isAnonymous: false,
      department: "Recursos Humanos",
      assignments: [{ userId: "user2", userName: "Carlos Rodríguez" }],
    },
    {
      idTable: 3,
      id: "RPT-2024-003",
      subject: "Mal uso de recursos corporativos",
      category: "Finanzas",
      severity: "LOW",
      deadline: "2024-01-25",
      status: "closed",
      content: {
        description: "Reporte sobre mal uso de recursos de la empresa...",
      },
      submittedAt: new Date(2024, 0, 8, 16, 45),
      source: "ETHIC_LINE",
      isAnonymous: true,
      department: "Finanzas",
      assignments: [{ userId: "user3", userName: "Ana Martínez" }],
    },
    {
      idTable: 4,
      id: "RPT-2024-004",
      subject: "Conflicto de intereses",
      category: "Compliance",
      severity: "HIGH",
      deadline: "2024-01-18",
      status: "progress",
      content: {
        description: "Posible conflicto de intereses en contratación...",
      },
      submittedAt: new Date(2024, 0, 11, 11, 20),
      source: "CUSTOM_FORM",
      isAnonymous: false,
      department: "Compliance",
      assignments: [{ userId: "user1", userName: "María González" }],
    },
    {
      idTable: 5,
      id: "RPT-2024-005",
      subject: "Acoso laboral",
      category: "Recursos Humanos",
      severity: "HIGH",
      deadline: "2024-01-22",
      status: "new",
      content: {
        description: "Reporte de acoso laboral en el departamento...",
      },
      submittedAt: new Date(2024, 0, 13, 13, 10),
      source: "ETHIC_LINE",
      isAnonymous: true,
      department: "Recursos Humanos",
      assignments: [{ userId: "user2", userName: "Carlos Rodríguez" }],
    },
  ];

  // Generate chart data (monthly distribution)
  const chartData: ChartDataPoint[] = [
    { name: "Ene", reports: 45 },
    { name: "Feb", reports: 52 },
    { name: "Mar", reports: 38 },
    { name: "Abr", reports: 61 },
    { name: "May", reports: 49 },
    { name: "Jun", reports: 55 },
    { name: "Jul", reports: 42 },
    { name: "Ago", reports: 58 },
    { name: "Sep", reports: 63 },
    { name: "Oct", reports: 47 },
    { name: "Nov", reports: 51 },
    { name: "Dic", reports: 44 },
  ];

  // Generate category data
  const categoryData: CategoryData[] = [
    { name: "Recursos Humanos", value: 89, color: "#3B82F6", percentage: 36.0 },
    { name: "Seguridad", value: 67, color: "#EF4444", percentage: 27.1 },
    { name: "Finanzas", value: 45, color: "#10B981", percentage: 18.2 },
    { name: "Compliance", value: 32, color: "#F59E0B", percentage: 13.0 },
    { name: "Operaciones", value: 14, color: "#8B5CF6", percentage: 5.7 },
  ];

  // Generate department data
  const departmentData: DepartmentData[] = [
    { name: "Tecnología", count: 78, percentage: 31.6 },
    { name: "Recursos Humanos", count: 65, percentage: 26.3 },
    { name: "Finanzas", count: 42, percentage: 17.0 },
    { name: "Compliance", count: 35, percentage: 14.2 },
    { name: "Operaciones", count: 18, percentage: 7.3 },
    { name: "Marketing", count: 9, percentage: 3.6 },
  ];

  // Generate severity distribution
  const severityDistribution = {
    high: 23,
    medium: 89,
    low: 98,
    unknown: 37,
  };

  // Generate source distribution
  const sourceDistribution = {
    ethicLine: 156,
    customForm: 91,
  };

  // Generate weekly trend
  const weeklyTrend: ChartDataPoint[] = [
    { name: "Lun", reports: 12 },
    { name: "Mar", reports: 8 },
    { name: "Mié", reports: 15 },
    { name: "Jue", reports: 11 },
    { name: "Vie", reports: 9 },
    { name: "Sáb", reports: 3 },
    { name: "Dom", reports: 2 },
  ];

  return {
    organizationId: orgId,
    stats,
    recentReports,
    chartData,
    categoryData,
    departmentData,
    severityDistribution,
    sourceDistribution,
    weeklyTrend,
  };
}

// Demo data for super admin
export function generateDemoSuperAdminData() {
  return {
    organizations: [
      {
        id: "org1",
        name: "TechCorp Solutions",
        slug: "techcorp-solutions",
        totalReports: 247,
        newReports: 23,
        inProgress: 18,
        closedReports: 206,
        memberCount: 45,
        createdAt: new Date(2023, 5, 15),
        lastActivity: new Date(2024, 0, 13, 14, 30),
      },
      {
        id: "org2",
        name: "Global Industries",
        slug: "global-industries",
        totalReports: 189,
        newReports: 15,
        inProgress: 12,
        closedReports: 162,
        memberCount: 32,
        createdAt: new Date(2023, 7, 22),
        lastActivity: new Date(2024, 0, 12, 9, 15),
      },
      {
        id: "org3",
        name: "Innovate Labs",
        slug: "innovate-labs",
        totalReports: 134,
        newReports: 8,
        inProgress: 6,
        closedReports: 120,
        memberCount: 28,
        createdAt: new Date(2023, 9, 8),
        lastActivity: new Date(2024, 0, 11, 16, 45),
      },
      {
        id: "org4",
        name: "Future Systems",
        slug: "future-systems",
        totalReports: 98,
        newReports: 5,
        inProgress: 4,
        closedReports: 89,
        memberCount: 19,
        createdAt: new Date(2023, 11, 3),
        lastActivity: new Date(2024, 0, 10, 11, 20),
      },
      {
        id: "org5",
        name: "Digital Dynamics",
        slug: "digital-dynamics",
        totalReports: 76,
        newReports: 3,
        inProgress: 2,
        closedReports: 71,
        memberCount: 15,
        createdAt: new Date(2024, 0, 5),
        lastActivity: new Date(2024, 0, 9, 13, 10),
      },
    ],
    systemStats: {
      totalOrganizations: 5,
      totalReports: 744,
      totalUsers: 139,
      activeReports: 52,
      averageResolutionTime: 4.8,
      systemUptime: 99.9,
      totalAnonymousReports: 156,
      criticalReports: 23,
    },
  };
}

// Demo data for member dashboard
export function generateDemoMemberDashboardData(
  userId: string,
  orgId: string
): DashboardData {
  const stats: DashboardStats = {
    totalReports: 12,
    newReports: 3,
    inProgress: 2,
    closedReports: 7,
    percentageChange: 8.3,
    anonymousReports: 4,
    averageResolutionTime: 3.8,
    criticalReports: 1,
  };

  const recentReports: Report[] = [
    {
      idTable: 1,
      id: "RPT-2024-001",
      subject: "Violación de políticas de seguridad",
      category: "Seguridad",
      severity: "HIGH",
      deadline: "2024-01-15",
      status: "progress",
      content: {
        description:
          "Reporte de posible violación de políticas de seguridad...",
      },
      submittedAt: new Date(2024, 0, 10, 14, 30),
      source: "ETHIC_LINE",
      isAnonymous: true,
      department: "Tecnología",
      assignments: [{ userId, userName: "María González" }],
    },
    {
      idTable: 2,
      id: "RPT-2024-002",
      subject: "Conflicto de intereses",
      category: "Compliance",
      severity: "HIGH",
      deadline: "2024-01-18",
      status: "progress",
      content: {
        description: "Posible conflicto de intereses en contratación...",
      },
      submittedAt: new Date(2024, 0, 11, 11, 20),
      source: "CUSTOM_FORM",
      isAnonymous: false,
      department: "Compliance",
      assignments: [{ userId, userName: "María González" }],
    },
  ];

  const chartData: ChartDataPoint[] = [
    { name: "Ene", reports: 3 },
    { name: "Feb", reports: 2 },
    { name: "Mar", reports: 1 },
    { name: "Abr", reports: 4 },
    { name: "May", reports: 2 },
    { name: "Jun", reports: 3 },
    { name: "Jul", reports: 1 },
    { name: "Ago", reports: 2 },
    { name: "Sep", reports: 3 },
    { name: "Oct", reports: 2 },
    { name: "Nov", reports: 1 },
    { name: "Dic", reports: 2 },
  ];

  const categoryData: CategoryData[] = [
    { name: "Seguridad", value: 5, color: "#EF4444", percentage: 41.7 },
    { name: "Compliance", value: 4, color: "#F59E0B", percentage: 33.3 },
    { name: "Recursos Humanos", value: 2, color: "#3B82F6", percentage: 16.7 },
    { name: "Finanzas", value: 1, color: "#10B981", percentage: 8.3 },
  ];

  const departmentData: DepartmentData[] = [
    { name: "Tecnología", count: 6, percentage: 50.0 },
    { name: "Compliance", count: 4, percentage: 33.3 },
    { name: "Recursos Humanos", count: 2, percentage: 16.7 },
  ];

  const severityDistribution = {
    high: 3,
    medium: 6,
    low: 2,
    unknown: 1,
  };

  const sourceDistribution = {
    ethicLine: 8,
    customForm: 4,
  };

  const weeklyTrend: ChartDataPoint[] = [
    { name: "Lun", reports: 1 },
    { name: "Mar", reports: 0 },
    { name: "Mié", reports: 2 },
    { name: "Jue", reports: 1 },
    { name: "Vie", reports: 0 },
    { name: "Sáb", reports: 0 },
    { name: "Dom", reports: 0 },
  ];

  return {
    organizationId: orgId,
    stats,
    recentReports,
    chartData,
    categoryData,
    departmentData,
    severityDistribution,
    sourceDistribution,
    weeklyTrend,
  };
}
