/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  REPORT_PRIORITY,
  REPORT_SEVERITY,
  REPORT_STATUS,
  SUBMISSION_SOURCE,
} from "@/modules/app/constants/reports";
import { Priority } from "@prisma/client";

export interface ReportFilters {
  search: string;
  status: string;
  severity: string;
  source: string;
  dateRange: string;
  assignee: string;
  // New advanced filters
  priority?: string; // e.g., 'all' | 'urgent' | 'high' | 'normal' | 'low'
  departmentId?: string; // department id or 'all'
  reportType?: string; // irregularity type id or label
  anonymous?: string; // 'all' | 'anonymous' | 'identified'
  sla?: "all" | "green" | "yellow" | "orange" | "red"; // SLA semaphore filter
}

export interface ReportAssignment {
  id: string;
  reportId: number;
  userId: string;
  userName: string;
  createdAt: string;
  createdBy: string;
}

export interface ReportItem {
  id: number;
  orgId: string;
  assignments: ReportAssignment[];
  formId: number | null;
  departmentId: string | null;
  content: string;
  source: "CUSTOM_FORM" | "ETHIC_LINE" | "EMAIL" | "WHATSAPP" | "API";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any;
  submittedAt: Date;
  aiSummary: string | null;
  aiSeverity: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
  processedAt: Date | null;
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "ARCHIVED";
  priority: Priority;
  type: string | null;
  location: string | null;
  isAnonymous: boolean;
  reporterName: string | null;
  reporterEmail: string | null;
  reporterPhone: string | null;
  internalNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  department?: {
    id: string;
    name: string;
  } | null;
  form?: {
    title: string;
  };
  _count?: {
    comments: number;
    attachments: number;
    assignments: number;
  };
}

export interface ReportsStats {
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  highPriorityReports: number;
  activeInvestigators: number;
  averageResolutionTime: number;
  totalReportsChange: string;
  pendingReportsChange: string;
  resolvedReportsChange: string;
  highPriorityReportsChange: string;
}

export interface ExtendedReportsStats extends ReportsStats {
  inProgressReports: number;
  underReviewReports: number;
  closedReports: number;
  highSeverityReports: number;
  mediumSeverityReports: number;
  lowSeverityReports: number;
  anonymousReports: number;
  ethicLineReports: number;
  customFormReports: number;
  assignmentRate: number;
  overdueReports: number;
  newReportsLast7Days: number;
  newReportsLast7DaysChange: string;
}

export interface ReportsWithPagination {
  reports: ReportItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export interface FilterCounts {
  status: Record<string, number>;
  severity: Record<string, number>;
  source: Record<string, number>;
}

export interface FormSubmission {
  id: number;
  orgId: string;
  formId: number | null;
  departmentId: string | null;
  content: string;
  source: keyof typeof SUBMISSION_SOURCE;
  metadata: {
    // sanitized, non-technical metadata only
    aiAnalysis?: any;
    requiresUrgentAction?: string;
  } | null;
  submittedAt: string;
  aiSummary: string | null;
  aiSeverity: keyof typeof REPORT_SEVERITY;
  processedAt: string | null;
  status: keyof typeof REPORT_STATUS;
  priority: keyof typeof REPORT_PRIORITY;
  type: string | null;
  location: string | null;
  isAnonymous: boolean;
  reporterName: string | null;
  reporterEmail: string | null;
  reporterPhone: string | null;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  // Relations
  department?: {
    id: string;
    name: string;
  } | null;
  comments?: ReportComment[];
  attachments?: ReportAttachment[];
  activities?: ReportActivity[];
  assignments?: ReportAssignment[];
}

export interface ReportContent {
  isAnonymous: boolean;
  reporter?: {
    firstName: string;
    lastName: string;
    gender: string;
    email: string;
    idDocument: string;
    phone: string;
  };
  reported: {
    firstName: string;
    lastName: string;
    department: string;
    position: string;
  };
  irregularityType: string;
  questionnaire: Record<string, any>;
  submittedAt: string;
  workRelationship: string;
  consultedBefore: string;
  consultationDetails: string;
}

export interface ReportComment {
  id: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  submissionId: number;
  authorId: string;
  authorName: string;
  authorEmail?: string;
  isInternal: boolean;
}

export interface ReportAttachment {
  id: number;
  filename: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  submissionId: number;
  uploadedById: string;
  uploadedByName: string;
}

export interface ReportActivity {
  id: number;
  action: string;
  details?: Record<string, any>;
  createdAt: string;
  submissionId: number;
  userId: string;
  userName: string;
}

export interface ReportUpdate {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate?: string | Date | null;
  assignedTo?: string | null;
  createdAt: string | Date;
  updatedAt?: string | Date;
  submissionId?: number;
  parentId?: number | null;
  order?: number;
  createdById?: string;
  createdByName?: string;
  completionNotes?: string | null;
  completedAt?: string | Date | null;
}

export interface ChatMessage {
  id: number;
  sender: "admin" | "reporter";
  content: string;
  timestamp: string;
  senderName: string;
  attachments?: ReportAttachment[];
  authorId: string;
}

export interface TimelineEvent {
  id: number;
  type:
    | "submitted"
    | "assigned"
    | "message"
    | "update"
    | "completed"
    | "status_changed";
  title: string;
  description: string;
  timestamp: string;
  user?: string;
  metadata?: Record<string, any>;
}
