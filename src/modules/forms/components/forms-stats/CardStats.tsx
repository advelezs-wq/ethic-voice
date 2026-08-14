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
    <div className={`rounded-xl border border-emerald-100 bg-white p-4 ${className}`}>
      <div className="flex-col items-start">
        {icon}
        <h3 className="text-sm text-slate-600 font-medium">{title}</h3>
      </div>
      <div className="pt-2">
        <div className="text-2xl font-bold">
          {isLoading && <span className="inline-block h-6 w-16 rounded bg-emerald-100 animate-pulse" />}
          {!isLoading && value}
        </div>
        <p className="text-xs text-slate-600 pt-1">{helperText}</p>
      </div>
    </div>
  );
};
