import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { ReportAttachment } from "@/types/reports";
import {
  getReportAttachments,
  uploadReportAttachment,
} from "@/actions/reports.actions";

export function useReportAttachments(reportId: number) {
  const { user } = useUser();
  const [attachments, setAttachments] = useState<ReportAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchAttachments = async () => {
      try {
        const attachmentsData = await getReportAttachments(reportId);
        setAttachments(attachmentsData);
      } catch (err) {
        console.error("Error loading attachments:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (reportId) {
      fetchAttachments();
    }
  }, [reportId]);

  const uploadFile = async (file: File) => {
    if (!user) return;

    setIsUploading(true);
    try {
      const newAttachment = await uploadReportAttachment(
        reportId,
        file,
        user.id,
        user.fullName || "Usuario"
      );
      setAttachments((prev) => [...prev, newAttachment]);
      return newAttachment;
    } catch (err) {
      console.error("Error uploading file:", err);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    attachments,
    isLoading,
    isUploading,
    uploadFile,
  };
}
