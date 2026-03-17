"use client";

import { Card } from "@heroui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function SubmissionSourceChart({ analytics }: { analytics: any }) {
  const chartData = [
    {
      name: "Formularios",
      value: analytics.totals.customForms,
      percentage: analytics.percentages.customForms,
    },
    {
      name: "EthicVoice Web",
      value: analytics.totals.ethicLine,
      percentage: analytics.percentages.ethicLine,
    },
  ];

  const COLORS = ["#8b5cf6", "#3b82f6"];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Distribución de Denuncias</h3>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ percentage }) => `${(percentage ?? 0).toFixed(1)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
