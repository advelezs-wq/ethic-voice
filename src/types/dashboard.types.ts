import { Priority, SubmissionSource } from "@prisma/client";

export interface DashboardStats {
  newReports: number;
  inProgress: number;
  closedReports: number;
  totalReports: number;
  percentageChange: number;
  anonymousReports: number;
  averageResolutionTime: number;
  criticalReports: number;
}

export interface Report {
  idTable: number;
  id: string;
  subject: string;
  category: string;
  severity: Priority;
  deadline: string;
  status: "new" | "progress" | "closed" | "archived";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any;
  submittedAt: Date;
  source: SubmissionSource;
  isAnonymous: boolean;
  department?: string;
  assigneeId?: string; // Optional for backward compatibility
  assignments?: Array<{
    userId: string;
    userName: string;
  }>;
}

export interface ChartDataPoint {
  name: string;
  reports: number;
}

export interface CategoryData {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

export interface DepartmentData {
  name: string;
  count: number;
  percentage: number;
}

export interface TimelineData {
  hour: number;
  count: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentReports: Report[];
  chartData: ChartDataPoint[];
  categoryData: CategoryData[];
  departmentData: DepartmentData[];
  organizationId: string;
  severityDistribution: {
    high: number;
    medium: number;
    low: number;
    unknown: number;
  };
  sourceDistribution: {
    ethicLine: number;
    customForm: number;
  };
  weeklyTrend: ChartDataPoint[];
}
