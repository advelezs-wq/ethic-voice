"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { getTeamPerformance } from "@/actions/team.actions";

interface TeamPerformanceProps {
  organizationId: string;
}

interface TeamMemberStats {
  userId: string;
  userName: string;
  assignedReports: number;
  completedReports: number;
  averageResolutionTime: number;
  performanceScore: number;
}

export const TeamPerformance: React.FC<TeamPerformanceProps> = ({
  organizationId,
}) => {
  const [teamStats, setTeamStats] = useState<TeamMemberStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeamData() {
      try {
        const data = await getTeamPerformance(organizationId);
        setTeamStats(data);
      } catch (error) {
        console.error("Error fetching team performance:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTeamData();
  }, [organizationId]);

  if (loading) return null;

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Rendimiento del Equipo</h3>
      </CardHeader>
      <CardBody>
        <div className="space-y-3">
          {teamStats.map((member) => (
            <div
              key={member.userId}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-medium">{member.userName}</p>
                <p className="text-sm text-gray-600">
                  {member.assignedReports} asignados • {member.completedReports}{" "}
                  completados
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{member.performanceScore}%</p>
                <p className="text-xs text-gray-600">Rendimiento</p>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};
