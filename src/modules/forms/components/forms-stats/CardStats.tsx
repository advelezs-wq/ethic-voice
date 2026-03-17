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
    <div className={`rounded-xl border border-gray-200 bg-white p-4 ${className}`}>
      <div className="flex-col items-start">
        {icon}
        <h3 className="text-sm text-gray-700 font-medium">{title}</h3>
      </div>
      <div className="pt-2">
        <div className="text-2xl font-bold">
          {isLoading && <span className="inline-block h-6 w-16 rounded bg-gray-200 animate-pulse" />}
          {!isLoading && value}
        </div>
        <p className="text-xs text-gray-700 pt-1">{helperText}</p>
      </div>
    </div>
  );
};
