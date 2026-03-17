// app/types/submission.types.ts
export enum SubmissionSource {
  CUSTOM_FORM = "CUSTOM_FORM",
  ETHIC_LINE = "ETHIC_LINE",
  EMAIL = "EMAIL",
  WHATSAPP = "WHATSAPP",
  API = "API",
}

export interface SubmissionMetadata {
  source: SubmissionSource;
  formId?: number;
  formUrl?: string;
  // Technical fields removed for privacy: ipAddress, userAgent
  timestamp?: Date;
  // Nuevos campos para AI
  aiProcessed?: boolean;
  aiJobId?: string;
  emailMetadata?: {
    messageId: string;
    from: string;
    subject: string;
    receivedAt: string;
  };
  whatsappMetadata?: {
    phoneNumber: string;
    messageId: string;
  };
}

// Tipos para AI Processing
export interface AIAnalysisResult {
  severity: "HIGH" | "MEDIUM" | "LOW";
  priority: "URGENT" | "HIGH" | "NORMAL" | "LOW";
  summary: string;
  type: string;
  suggestedDepartment?: string;
  keyFindings: string[];
  immediateActions: string[];
  riskFactors: string[];
  involvedParties: {
    name: string;
    role: string;
    department?: string;
  }[];
  evidenceMentioned: string[];
  confidence: number; // 0-100
}

export interface ProcessingStatus {
  submissionId: number;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  currentStep: string;
  error?: string;
  result?: AIAnalysisResult;
}
