"use client";

import { Card } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getSeverityLabel } from "../../utils/dashboard.utils";

export function RecentSubmissionsTable({
  submissions,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submissions: any[];
}) {
  const getSourceLabel = (source: string) => {
    return source === "ETHIC_LINE" ? "EthicVoice Web" : "Formulario";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "HIGH":
        return "danger";
      case "MEDIUM":
        return "warning";
      case "LOW":
        return "success";
      default:
        return "default";
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Denuncias Recientes</h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">ID</th>
              <th className="text-left py-2">Fuente</th>
              <th className="text-left py-2">Fecha</th>
              <th className="text-left py-2">Severidad</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => (
              <tr key={submission.id} className="border-b">
                <td className="py-2">#{submission.id}</td>
                <td className="py-2">
                  <Chip size="sm" variant="flat">
                    {getSourceLabel(submission.source)}
                  </Chip>
                </td>
                <td className="py-2">
                  {format(new Date(submission.submittedAt), "dd MMM yyyy", {
                    locale: es,
                  })}
                </td>
                <td className="py-2">
                  <Chip
                    size="sm"
                    color={getSeverityColor(submission.aiSeverity)}
                  >
                    {getSeverityLabel(submission.aiSeverity)}
                  </Chip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
