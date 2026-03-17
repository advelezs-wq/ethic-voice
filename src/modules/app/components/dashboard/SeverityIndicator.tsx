/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Progress } from "@heroui/progress";

interface SeverityIndicatorProps {
  distribution: {
    high: number;
    medium: number;
    low: number;
    unknown: number;
  };
}

export const SeverityIndicator: React.FC<SeverityIndicatorProps> = ({
  distribution,
}) => {
  const total =
    distribution.high +
    distribution.medium +
    distribution.low +
    distribution.unknown;

  const severityLevels = [
    {
      name: "Alta",
      value: distribution.high,
      percentage: total > 0 ? (distribution.high / total) * 100 : 0,
      color: "danger",
      icon: (
        <i
          className="icon-[lucide--triangle-alert] size-5 text-red-600"
          role="img"
          aria-hidden="true"
        />
      ),
      bgColor: "bg-red-100",
      iconColor: "text-red-600",
    },
    {
      name: "Media",
      value: distribution.medium,
      percentage: total > 0 ? (distribution.medium / total) * 100 : 0,
      color: "warning",
      icon: (
        <i
          className="icon-[lucide--circle-alert] size-5 text-yellow-600"
          role="img"
          aria-hidden="true"
        />
      ),
      bgColor: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    {
      name: "Baja",
      value: distribution.low,
      percentage: total > 0 ? (distribution.low / total) * 100 : 0,
      color: "success",
      icon: (
        <i
          className="icon-[lucide--info] size-5 text-green-600"
          role="img"
          aria-hidden="true"
        />
      ),
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      name: "Sin clasificar",
      value: distribution.unknown,
      percentage: total > 0 ? (distribution.unknown / total) * 100 : 0,
      color: "default",
      icon: (
        <i
          className="icon-[lucide--circle-help] size-5 text-gray-600"
          role="img"
          aria-hidden="true"
        />
      ),
      bgColor: "bg-gray-100",
      iconColor: "text-gray-600",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Indicador de Severidad</h3>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {severityLevels.map((level) => {
            return (
              <div key={level.name} className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${level.bgColor}`}>
                  {level.icon}
                </div>
                <div>
                  <p className="text-sm font-medium">{level.name}</p>
                  <p className="text-2xl font-bold">{level.value}</p>
                  <p className="text-xs text-gray-500">
                    {(level.percentage ?? 0).toFixed(1)}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-2 mt-6">
          {severityLevels.map((level) => (
            <div key={level.name}>
              <div className="flex justify-between text-sm mb-1">
                <span>{level.name}</span>
                <span>{(level.percentage ?? 0).toFixed(1)}%</span>
              </div>
              <Progress
                value={level.percentage}
                color={level.color as any}
                size="md"
              />
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};
