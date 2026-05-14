"use client";

import React, { useState, useEffect } from "react";
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

type TabKey = "overview" | "timeline" | "chat" | "tasks" | "updates";

interface ReportTabsContainerProps {
  report: FormSubmission;
  parsedContent: ReportContentType;
  reportId: number;
}

const TABS: {
  key: TabKey;
  label: string;
  icon: string;
  adminOnly?: boolean;
}[] = [
  { key: "overview", label: "Resumen", icon: "icon-[lucide--file-text]" },
  { key: "timeline", label: "Cronología", icon: "icon-[lucide--clock]" },
  {
    key: "chat",
    label: "Comunicación",
    icon: "icon-[lucide--message-circle]",
  },
  { key: "tasks", label: "Tareas", icon: "icon-[lucide--check-square]" },
  {
    key: "updates",
    label: "Actualizaciones",
    icon: "icon-[lucide--list-checks]",
  },
];

export const ReportTabsContainer: React.FC<ReportTabsContainerProps> = ({
  report,
  parsedContent,
  reportId,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [unreadChat, setUnreadChat] = useState<number>(0);
  const search = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const tab = search.get("tab") as TabKey | null;
    if (tab && TABS.some((t) => t.key === tab)) {
      setActiveTab(tab);
    }
  }, [search]);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    const params = new URLSearchParams(search.toString());
    params.set("tab", key);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white/95 shadow-none">
      {/* Tab Navigation */}
      <div className="overflow-x-auto border-b border-emerald-100 bg-emerald-50/45">
        <nav className="flex px-2 pt-2 gap-1 min-w-max" aria-label="Secciones del caso">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const isChat = tab.key === "chat";
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-all duration-150 whitespace-nowrap
                  ${
                    isActive
                      ? "bg-white text-emerald-900 border-b-2 border-emerald-700"
                      : "text-gray-500 hover:text-emerald-800 hover:bg-white/70 border-b-2 border-transparent"
                  }`}
                aria-current={isActive ? "page" : undefined}
              >
                <i className={`${tab.icon} size-4 shrink-0`} />
                <span>{tab.label}</span>
                {isChat && unreadChat > 0 && (
                  <span className="ml-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                    {unreadChat > 99 ? "99+" : unreadChat}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-5 sm:p-6">
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
        {activeTab === "updates" && (
          <ReportUpdates reportId={reportId} report={report} />
        )}
      </div>
    </div>
  );
};
