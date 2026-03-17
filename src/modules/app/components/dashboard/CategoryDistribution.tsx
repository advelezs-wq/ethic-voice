import React from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Progress } from "@heroui/progress";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Label,
} from "recharts";
import type { CategoryData } from "@/types/dashboard.types";

interface CategoryDistributionProps {
  categoryData: CategoryData[];
}

export const CategoryDistribution: React.FC<CategoryDistributionProps> = ({
  categoryData,
}) => {
  // ✅ Add defensive check for undefined/null data
  if (!categoryData || !Array.isArray(categoryData)) {
    return (
      <Card>
        <CardHeader>
          <h4 className="text-lg font-semibold">Distribución por Categoría</h4>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-center h-40">
            <p className="text-gray-500 text-sm">No hay datos disponibles</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  // ✅ Ensure we have valid data before processing
  const validCategoryData = categoryData.length > 0 ? categoryData : [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 shadow-lg rounded-lg border border-gray-200">
          <p className="text-sm font-medium">{payload[0].name}</p>
          <p className="text-sm text-gray-600">
            {payload[0].value} reportes (
            {(payload[0]?.payload?.percentage ?? 0).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Distribución por Categoría</h3>
      </CardHeader>
      <CardBody>
        <div className="w-full mb-4">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={validCategoryData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                dataKey="value"
              >
                {validCategoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Label />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-3 mb-4">
          {validCategoryData.slice(0, 5).map((category, index) => {
            return (
              <div key={category.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span className="text-sm text-gray-700">
                      {category.name}
                    </span>
                  </div>
                  <span className="text-sm font-medium">{category.value}</span>
                </div>

                <Progress
                  value={category.percentage}
                  size="md"
                  className="max-w-full"
                  color={
                    index === 0 ? "warning" : index === 1 ? "danger" : "danger"
                  }
                />
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
};
