"use client";

import React, { useState } from "react";
import { ReportContent } from "./ReportContent";
import { ReportTimeline } from "./ReportTimeline";
import { ReportChat } from "./ReportChat";
import { ReportUpdates } from "./ReportUpdates";
import { ReportTasks } from "./ReportTasks";
import {
  FormSubmission,
  ReportContent as ReportContentType,
} from "@/types/reports";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

interface ReportTabsContainerProps {
  report: FormSubmission;
  parsedContent: ReportContentType;
  reportId: number;
}

export const ReportTabsContainer: React.FC<ReportTabsContainerProps> = ({
  report,
  parsedContent,
  reportId,
}) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "timeline" | "chat" | "tasks"
  >("overview");
  const [unreadChat, setUnreadChat] = useState<number>(0);

  const tabs = [
    { key: "overview", label: "Resumen", icon: "📋" },
    { key: "timeline", label: "Cronología", icon: "📅" },
    { key: "chat", label: "Comunicación", icon: "💬", unread: unreadChat },
    { key: "tasks", label: "Tareas", icon: "✅" },
  ];

  const search = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const tab = search.get("tab");
    if (tab && ["overview", "timeline", "chat", "tasks"].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [search]);

  const openTaskFromQuery = search.get("task");

  return (
    <>
      {/* Navigation Tabs */}
      <div className="mb-6 sm:mb-8 border-b border-gray-200 overflow-x-auto">
        <nav className="flex gap-4 sm:gap-8 min-w-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-3 sm:py-4 px-2 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.key
                  ? "border-blue-900 text-blue-900"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span>{tab.icon}</span>
              <span className="relative inline-flex items-center">
                {tab.label}
                {tab.key === "chat" && tab.unread && tab.unread > 0 && (
                  <>
                    <span className="ml-1 text-[11px] font-semibold">
                      ({tab.unread > 99 ? "99+" : tab.unread})
                    </span>
                    <span className="absolute -top-1 -right-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                      </span>
                    </span>
                  </>
                )}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "overview" && (
          <ReportContent report={report} parsedContent={parsedContent} />
        )}
        {activeTab === "timeline" && (
          <ReportTimeline reportId={reportId} report={report} />
        )}
        {activeTab === "chat" && (
          <ReportChat
            reportId={reportId}
            reportStatus={report.status}
            onUnreadChange={setUnreadChat}
          />
        )}
        {activeTab === "tasks" && <ReportTasks reportId={report.id} />}
      </div>
    </>
  );
};
