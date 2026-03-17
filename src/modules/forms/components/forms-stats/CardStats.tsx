import { Card, CardBody, CardHeader, Skeleton } from "@heroui/react";
import React, { ReactNode } from "react";

interface CardStatsProps {
  title: string;
  value: string;
  helperText: string;
  className: string;
  isLoading: boolean;
  icon: ReactNode;
}

export const CardStats = ({
  title,
  value,
  helperText,
  className,
  isLoading,
  icon,
}: CardStatsProps) => {
  return (
    <Card className={className}>
      <CardHeader className="flex-col items-start">
        {icon}
        <h3 className="text-sm text-gray-700 font-medium">{title}</h3>
      </CardHeader>
      <CardBody>
        <div className="text-2xl font-bold">
          {isLoading && (
            <Skeleton>
              <span>0</span>
            </Skeleton>
          )}
          {!isLoading && value}
        </div>
        <p className="text-xs text-gray-700 pt-1">{helperText}</p>
      </CardBody>
    </Card>
  );
};
