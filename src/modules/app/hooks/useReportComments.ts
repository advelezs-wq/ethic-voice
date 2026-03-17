import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { ReportComment } from "@/types/reports";
import { addReportComment, getReportComments } from "@/actions/reports.actions";

export function useReportComments(reportId: number) {
  const { user } = useUser();
  const [comments, setComments] = useState<ReportComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const commentsData = await getReportComments(reportId);
        setComments(commentsData);
      } catch (err) {
        console.error("Error loading comments:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (reportId) {
      fetchComments();
    }
  }, [reportId]);

  const addComment = async (content: string, isInternal = false) => {
    if (!user || !content.trim()) return;

    setIsSubmitting(true);
    try {
      const newComment = await addReportComment(
        reportId,
        content,
        user.id,
        user.fullName || "Usuario",
        user.emailAddresses[0]?.emailAddress,
        isInternal
      );
      setComments((prev) => [...prev, newComment]);
    } catch (err) {
      console.error("Error adding comment:", err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    comments,
    isLoading,
    isSubmitting,
    addComment,
  };
}
