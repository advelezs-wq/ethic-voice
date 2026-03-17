/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { FormSubmission, ReportContent } from "@/types/reports";
import { parseReportContent } from "../utils/reports";
import {
  getReport,
  updateReportPriority,
  updateReportProcessedAt,
  updateReportStatus,
} from "@/actions/reports.actions";

export function useReport(reportId: number) {
  const { user } = useUser();
  const [report, setReport] = useState<FormSubmission | null>(null);
  const [parsedContent, setParsedContent] = useState<ReportContent | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const reportData = await getReport(reportId);
        setReport(reportData);

        const parsed = parseReportContent(reportData.content);
        setParsedContent(parsed);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error loading report";
        setError(errorMessage);
        throw err; // Re-throw to be caught by the component
      } finally {
        setIsLoading(false);
      }
    };

    if (reportId) {
      fetchReport();
    }
  }, [reportId]);

  const updateProcessedAt = async () => {
    if (!report || !user) {
      throw new Error("Report or user not available");
    }

    const currentDate = new Date();

    try {
      await updateReportProcessedAt(reportId, currentDate);
      setReport((prev) =>
        prev ? { ...prev, processedAt: currentDate.toISOString() } : null
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error updating processed date";
      setError(errorMessage);
      throw err; // Re-throw to be caught by the component
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!report || !user) {
      throw new Error("Report or user not available");
    }

    try {
      await updateReportStatus(reportId, newStatus as any);
      setReport((prev) =>
        prev ? { ...prev, status: newStatus as any } : null
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error updating status";
      setError(errorMessage);
      throw err; // Re-throw to be caught by the component
    }
  };

  const updatePriority = async (newPriority: string) => {
    if (!report || !user) {
      throw new Error("Report or user not available");
    }

    try {
      await updateReportPriority(
        reportId,
        newPriority,
        user.id,
        user.fullName || "Usuario"
      );
      setReport((prev) =>
        prev ? { ...prev, priority: newPriority as any } : null
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error updating priority";
      setError(errorMessage);
      throw err; // Re-throw to be caught by the component
    }
  };

  return {
    report,
    parsedContent,
    isLoading,
    error,
    updateStatus,
    updateProcessedAt,
    updatePriority,
  };
}
