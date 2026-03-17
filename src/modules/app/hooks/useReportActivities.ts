import { getReportActivities } from "@/actions/reports.actions";
import { ReportActivity } from "@/types/reports";
import { useState, useEffect } from "react";

export function useReportActivities(reportId: number) {
  const [activities, setActivities] = useState<ReportActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      const activitiesData = await getReportActivities(reportId);
      setActivities(activitiesData);
    } catch (err) {
      console.error("Error loading activities:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (reportId) {
      fetchActivities();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId]);

  return {
    activities,
    isLoading,
    refetch: fetchActivities,
  };
}
