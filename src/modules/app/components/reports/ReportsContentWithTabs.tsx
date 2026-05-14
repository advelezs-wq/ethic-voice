"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ReportFilters, ReportItem } from "@/types/reports";
import { Tabs, Tab, Card, CardBody } from "@heroui/react";
import { ReportsContent } from "./ReportsContent";

interface ReportsData {
  reports: ReportItem[];
  totalCount: number;
}

interface ReportsContentWithTabsProps {
  activeReports: ReportsData;
  archivedReports: ReportsData;
  closedReports: ReportsData;
  initialFilters: ReportFilters;
  currentPage: number;
  pageSize: number;
  userRole: string;
  isSuperAdmin: boolean;
  userId: string;
  organizationId?: string;
  activeTab: string;
  superAdminScope?: "all" | "org";
  selectedOrganizationName?: string;
}

export function ReportsContentWithTabs({
  activeReports,
  archivedReports,
  closedReports,
  initialFilters,
  currentPage,
  pageSize,
  userRole,
  isSuperAdmin,
  userId,
  organizationId,
  activeTab,
  superAdminScope = "org",
  selectedOrganizationName,
}: ReportsContentWithTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedTab, setSelectedTab] = useState(activeTab);

  const handleTabChange = (tab: string) => {
    setSelectedTab(tab);

    // Update URL with new tab parameter
    const params = new URLSearchParams(searchParams);
    params.set("tab", tab);
    params.delete("page"); // Reset to first page when changing tabs

    router.push(`/app/reports?${params.toString()}`);
  };

  const getTabData = (tab: string) => {
    if (tab === "archived") return archivedReports;
    if (tab === "closed") return closedReports;
    return activeReports;
  };

  const isArchivedView = selectedTab === "archived";
  const currentData = getTabData(selectedTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {isSuperAdmin
            ? superAdminScope === "all"
              ? "Gestión Global de Reportes"
              : "Reportes por Organización"
            : userRole === "ADMIN"
              ? "Gestión de Reportes"
              : "Mis Reportes Asignados"}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {isSuperAdmin
            ? superAdminScope === "all"
              ? "Administra reportes de todas las organizaciones en una sola vista."
              : `Estás viendo únicamente la organización seleccionada${selectedOrganizationName ? `: ${selectedOrganizationName}` : ""}.`
            : userRole === "ADMIN"
              ? "Administra y da seguimiento a todas las denuncias de tu organización"
              : "Revisa y gestiona los reportes que tienes asignados"}
        </p>
      </div>

      {/* Tabs */}
      <Card>
        <CardBody className="p-0">
          <Tabs
            selectedKey={selectedTab}
            onSelectionChange={(key) => handleTabChange(key as string)}
            aria-label="Reportes tabs"
            variant="underlined"
            classNames={{
              tabList:
                "w-full px-2 gap-6 border-b border-divider rounded-none",
              tab: "px-0 h-12 text-sm font-medium data-[hover=true]:text-foreground data-[selected=true]:text-primary",
              tabContent: "group-data-[selected=true]:text-primary",
              cursor: "h-[2px] bg-primary rounded-none",
            }}
          >
            <Tab
              key="active"
              title={
                <div className="flex items-center gap-2">
                  <i className="icon-[lucide--file-text] size-4" />
                  <span>Reportes Activos</span>
                  <span className="text-xs px-2 py-0.5 rounded-full border border-default-200 text-foreground-600">
                    {activeReports.totalCount}
                  </span>
                </div>
              }
            />
            <Tab
              key="archived"
              title={
                <div className="flex items-center gap-2">
                  <i className="icon-[lucide--archive] size-4" />
                  <span>Reportes Archivados</span>
                  <span className="text-xs px-2 py-0.5 rounded-full border border-default-200 text-foreground-600">
                    {archivedReports.totalCount}
                  </span>
                </div>
              }
            />
            <Tab
              key="closed"
              title={
                <div className="flex items-center gap-2">
                  <i className="icon-[lucide--lock] size-4" />
                  <span>Reportes Cerrados</span>
                  <span className="text-xs px-2 py-0.5 rounded-full border border-default-200 text-foreground-600">
                    {closedReports.totalCount}
                  </span>
                </div>
              }
            />
          </Tabs>
        </CardBody>
      </Card>

      {/* Content */}
      <ReportsContent
        initialReports={currentData.reports}
        initialFilters={initialFilters}
        totalCount={currentData.totalCount}
        currentPage={currentPage}
        pageSize={pageSize}
        userRole={userRole}
        isSuperAdmin={isSuperAdmin}
        userId={userId}
        organizationId={organizationId}
        isArchivedView={isArchivedView}
        superAdminScope={superAdminScope}
        selectedOrganizationName={selectedOrganizationName}
      />
    </div>
  );
}
