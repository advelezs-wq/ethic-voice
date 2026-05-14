"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Spinner,
  Tab,
  Tabs,
  User,
} from "@heroui/react";
import { SuperAdminPanelShell } from "./super-admin/SuperAdminPanelShell";
import { ConfirmActionModal } from "./super-admin/ConfirmActionModal";
import { showError, showSuccess } from "@/modules/core/utils/safe-toast";
import { PLAN_CONFIGS, PlanType } from "@/types/subscription.types";
import { DashboardData } from "@/types/dashboard.types";
import {
  getChartData,
  getCategoryData,
  getRecentReports,
  getSeverityDistribution,
  getSourceDistribution,
} from "@/actions/reports.actions";
import { getDepartmentsWithStats } from "@/actions/department.actions";
import { StatsCards } from "../analytics/StatsCards";
import { StatisticsChart } from "../dashboard/StatisticsChart";
import { WeeklyTrendChart } from "../dashboard/WeeklyTrendChart";
import { SeverityIndicator } from "../dashboard/SeverityIndicator";

type OrgSection = "resumen" | "denuncias" | "plan" | "miembros" | "analitica";
type MemberRole = "ADMIN" | "MEMBER";
type BillingCycle = "MONTHLY" | "YEARLY";

interface OrganizationDetailsViewProps {
  data: {
    organization: {
      id: string;
      name: string;
      slug: string;
      isActive: boolean;
      createdAt: string | Date;
      _count?: { forms?: number; complaints?: number; memberships?: number };
    };
    stats: {
      totalReports?: number;
      newReports?: number;
      inProgress?: number;
      closedReports?: number;
      percentageChange?: number;
      anonymousReports?: number;
      averageResolutionTime?: number;
      criticalReports?: number;
    };
    teamPerformance: Array<{
      userId: string;
      userName: string;
      assignedReports: number;
      completedReports: number;
      performanceScore: number;
    }>;
  };
}

interface SubscriptionInfo {
  id: number;
  planType: PlanType;
  planName: string;
  status: string;
  billingCycle: BillingCycle;
  maxUsers: number;
  maxInvestigators: number;
  maxEmployees: number;
}

interface InvoiceItem {
  id: string;
  description: string;
  amount: string;
  currency: string;
  status: string;
  createdAt: string;
}

interface OrgMember {
  id: string;
  role: MemberRole;
  user: {
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
}

interface OrgReportRow {
  id: number;
  status: string;
  aiSeverity: string;
  aiSummary: string | null;
  source: string;
  submittedAt: string;
  reporterName: string | null;
  reporterEmail: string | null;
  isAnonymous: boolean;
}

type ReportsFilterTab = "active" | "archived" | "closed";

type PendingAction =
  | { type: "pause-subscription" | "resume-subscription" | "cancel-subscription"; subscriptionId: number }
  | { type: "change-plan"; targetPlan: PlanType }
  | { type: "remove-member"; memberId: string; memberName: string };

export function OrganizationDetailsView({ data }: OrganizationDetailsViewProps) {
  const { organization, stats } = data;
  const router = useRouter();
  const searchParams = useSearchParams();
  const section = (searchParams.get("section") as OrgSection) || "resumen";

  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [billingItems, setBillingItems] = useState<InvoiceItem[]>([]);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [targetBillingCycle, setTargetBillingCycle] = useState<BillingCycle>("MONTHLY");
  const [analytics, setAnalytics] = useState<DashboardData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [reports, setReports] = useState<OrgReportRow[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsTab, setReportsTab] = useState<ReportsFilterTab>("active");
  const [reportsSearch, setReportsSearch] = useState("");

  const membersSummary = useMemo(() => {
    const admins = members.filter((m) => m.role === "ADMIN").length;
    return { admins, investigators: Math.max(0, members.length - admins), total: members.length };
  }, [members]);

  const setSection = (next: OrgSection) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("section", next);
    router.replace(`/app/organizations/${organization.id}?${params.toString()}`);
  };

  const loadPlanData = useCallback(async () => {
    setLoadingPlan(true);
    try {
      const [subRes, billRes] = await Promise.all([
        fetch(`/api/organization/${organization.id}/subscription-details`, { cache: "no-store" }),
        fetch(`/api/organization/${organization.id}/billing-history?include=all`, { cache: "no-store" }),
      ]);
      setSubscription(subRes.ok ? (await subRes.json())?.subscription || null : null);
      setBillingItems(billRes.ok ? (await billRes.json())?.invoices || [] : []);
    } catch {
      showError("No se pudo cargar plan y facturación");
    } finally {
      setLoadingPlan(false);
    }
  }, [organization.id]);

  const loadMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const res = await fetch(`/api/organization/${organization.id}/members`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      setMembers((await res.json())?.members || []);
    } catch {
      showError("No se pudieron cargar los miembros");
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }, [organization.id]);

  const loadAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const [chartData, categoryData, departments, severityDistribution, sourceDistribution, recentReports] =
        await Promise.all([
          getChartData(organization.id),
          getCategoryData(organization.id),
          getDepartmentsWithStats(organization.id),
          getSeverityDistribution(organization.id),
          getSourceDistribution(organization.id),
          getRecentReports(organization.id, 10),
        ]);

      const totalReports = Math.max(1, stats.totalReports || 0);
      setAnalytics({
        organizationId: organization.id,
        stats: {
          totalReports: stats.totalReports || 0,
          newReports: stats.newReports || 0,
          inProgress: stats.inProgress || 0,
          closedReports: stats.closedReports || 0,
          percentageChange: stats.percentageChange || 0,
          anonymousReports: stats.anonymousReports || 0,
          averageResolutionTime: stats.averageResolutionTime || 0,
          criticalReports: stats.criticalReports || 0,
        },
        recentReports,
        chartData,
        categoryData,
        departmentData: departments.map((d) => ({
          name: d.name,
          count: d.reportCount,
          percentage: (d.reportCount / totalReports) * 100,
        })),
        severityDistribution,
        sourceDistribution,
        weeklyTrend: ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"].map((name, index) => ({
          name,
          reports: Math.max(0, Math.round((stats.totalReports || 0) / 7) + (index % 2 ? -1 : 1)),
        })),
      });
    } catch {
      showError("No se pudo cargar la analítica");
    } finally {
      setLoadingAnalytics(false);
    }
  }, [organization.id, stats]);

  const loadReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const params = new URLSearchParams({
        tab: reportsTab,
        q: reportsSearch,
        page: "1",
        pageSize: "20",
      });
      const res = await fetch(
        `/api/superadmin/organizations/${organization.id}/reports?${params.toString()}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error();
      const payload = await res.json();
      setReports(payload?.reports || []);
    } catch {
      showError("No se pudieron cargar las denuncias de la organización");
      setReports([]);
    } finally {
      setReportsLoading(false);
    }
  }, [organization.id, reportsSearch, reportsTab]);

  useEffect(() => {
    loadPlanData();
    loadMembers();
    loadAnalytics();
  }, [loadPlanData, loadMembers, loadAnalytics]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const quickOpenReportsWithOrgScope = () => {
    document.cookie = `ev_scope=org; path=/; max-age=${60 * 60 * 24 * 30}`;
    document.cookie = `ev_org=${organization.id}; path=/; max-age=${60 * 60 * 24 * 30}`;
    router.push("/app/reports");
  };

  const openReportDetail = (reportId: number) => {
    document.cookie = `ev_scope=org; path=/; max-age=${60 * 60 * 24 * 30}`;
    document.cookie = `ev_org=${organization.id}; path=/; max-age=${60 * 60 * 24 * 30}`;
    router.push(`/app/reports/${reportId}`);
  };

  const changeMemberRole = async (memberId: string, role: MemberRole) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/organization/${organization.id}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, role }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || "No se pudo actualizar rol");
      showSuccess("Rol actualizado");
      await loadMembers();
    } catch (error) {
      showError(error instanceof Error ? error.message : "No se pudo actualizar rol");
    } finally {
      setActionLoading(false);
    }
  };

  const runPendingAction = async () => {
    if (!pendingAction) return;
    setActionLoading(true);
    try {
      if (pendingAction.type === "remove-member") {
        const res = await fetch(`/api/organization/${organization.id}/remove-member`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId: pendingAction.memberId }),
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload?.error || "No se pudo eliminar miembro");
        showSuccess("Miembro eliminado");
        await loadMembers();
      } else if (pendingAction.type === "change-plan") {
        const res = await fetch("/api/subscriptions/change-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId: organization.id,
            newPlanType: pendingAction.targetPlan,
            newBillingCycle: targetBillingCycle,
            prorationMode: "immediate",
          }),
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload?.error || "No se pudo cambiar plan");
        showSuccess(`Cambio a ${pendingAction.targetPlan} iniciado`);
        if (payload?.payment?.paymentUrl) {
          window.location.href = payload.payment.paymentUrl;
          return;
        }
        await loadPlanData();
      } else {
        const endpoint =
          pendingAction.type === "pause-subscription"
            ? "/api/superadmin/subscriptions/pause"
            : pendingAction.type === "resume-subscription"
              ? "/api/superadmin/subscriptions/resume"
              : "/api/superadmin/subscriptions/cancel";
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscriptionId: pendingAction.subscriptionId }),
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload?.error || "No se pudo ejecutar acción");
        showSuccess("Suscripción actualizada");
        await loadPlanData();
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : "No se pudo completar la acción");
    } finally {
      setActionLoading(false);
      setPendingAction(null);
    }
  };

  const updateReportStatus = async (reportId: number, status: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/superadmin/organizations/${organization.id}/reports`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, status }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || "No se pudo actualizar el estado");
      showSuccess("Estado de denuncia actualizado");
      await loadReports();
      await loadAnalytics();
    } catch (error) {
      showError(error instanceof Error ? error.message : "No se pudo actualizar el estado");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmMeta = useMemo(() => {
    if (!pendingAction) return null;
    if (pendingAction.type === "remove-member") {
      return {
        title: "Eliminar miembro",
        description: `Vas a eliminar a ${pendingAction.memberName} de la organización.`,
        confirmLabel: "Confirmar eliminación",
        riskLevel: "high" as const,
      };
    }
    if (pendingAction.type === "change-plan") {
      return {
        title: "Cambiar plan",
        description: `Vas a cambiar al plan ${pendingAction.targetPlan}.`,
        confirmLabel: "Confirmar cambio",
        riskLevel: "medium" as const,
      };
    }
    if (pendingAction.type === "cancel-subscription") {
      return {
        title: "Cancelar suscripción",
        description: "La suscripción se cancelará al final del periodo vigente.",
        confirmLabel: "Confirmar cancelación",
        riskLevel: "high" as const,
      };
    }
    return {
      title: pendingAction.type === "pause-subscription" ? "Pausar suscripción" : "Reanudar suscripción",
      description: "Se aplicará el cambio de estado a la suscripción.",
      confirmLabel: "Confirmar",
      riskLevel: "medium" as const,
    };
  }, [pendingAction]);

  return (
    <SuperAdminPanelShell
      title={`Organización: ${organization.name}`}
      subtitle="Gestiona todo de la organización desde un solo lugar."
    >
      <Card className="border border-emerald-200/60 bg-white/95 mb-5">
        <CardBody className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-[#0d212c]">{organization.name}</h2>
              <Chip color={organization.isActive ? "success" : "danger"} size="sm" variant="flat">
                {organization.isActive ? "Activa" : "Inactiva"}
              </Chip>
            </div>
            <p className="text-sm text-default-500">{organization.slug}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="flat" className="border border-emerald-200 bg-white" onPress={quickOpenReportsWithOrgScope}>
              Ver denuncias de esta org
            </Button>
            <Button as={Link} href="/app/organizations" variant="light">
              Volver al listado
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card className="border border-emerald-200/60 bg-white/95 mb-5">
        <CardBody className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <Button variant="flat" className="justify-start border border-emerald-200 bg-emerald-50 text-[#0d212c]" onPress={() => setSection("denuncias")}>
            Gestionar denuncias de esta org
          </Button>
          <Button variant="flat" className="justify-start border border-emerald-200 bg-white text-[#0d212c]" onPress={() => setSection("plan")}>
            Ajustar plan y facturación
          </Button>
          <Button variant="flat" className="justify-start border border-emerald-200 bg-white text-[#0d212c]" onPress={() => setSection("miembros")}>
            Administrar miembros
          </Button>
          <Button variant="flat" className="justify-start border border-emerald-200 bg-white text-[#0d212c]" onPress={quickOpenReportsWithOrgScope}>
            Abrir módulo completo de reportes
          </Button>
        </CardBody>
      </Card>

      <Tabs selectedKey={section} onSelectionChange={(k) => setSection(String(k) as OrgSection)} variant="underlined">
        <Tab key="resumen" title="Resumen operativo">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5">
            <SummaryKpi label="Miembros" value={membersSummary.total} />
            <SummaryKpi label="Admins" value={membersSummary.admins} tone="primary" />
            <SummaryKpi label="Investigadores" value={membersSummary.investigators} tone="success" />
            <SummaryKpi label="Denuncias" value={organization._count?.complaints || stats.totalReports || 0} tone="warning" />
          </div>
        </Tab>

        <Tab key="denuncias" title="Denuncias">
          <div className="space-y-4 mt-5">
            <Card className="border border-emerald-200/60 bg-white/95">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold text-[#0d212c]">Denuncias por organización</h3>
                  <p className="text-xs text-default-500">
                    Gestiona estado y abre cada caso con contexto asegurado de esta organización.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={reportsSearch}
                    onChange={(e) => setReportsSearch(e.target.value)}
                    placeholder="Buscar denuncia..."
                    className="h-9 rounded-lg border border-default-200 px-3 text-sm outline-none"
                  />
                  <Button size="sm" variant="flat" onPress={loadReports}>
                    Buscar
                  </Button>
                </div>
              </CardHeader>
              <CardBody className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={reportsTab === "active" ? "solid" : "flat"}
                    color="primary"
                    onPress={() => setReportsTab("active")}
                  >
                    Activas
                  </Button>
                  <Button
                    size="sm"
                    variant={reportsTab === "closed" ? "solid" : "flat"}
                    color="primary"
                    onPress={() => setReportsTab("closed")}
                  >
                    Cerradas
                  </Button>
                  <Button
                    size="sm"
                    variant={reportsTab === "archived" ? "solid" : "flat"}
                    color="primary"
                    onPress={() => setReportsTab("archived")}
                  >
                    Archivadas
                  </Button>
                </div>

                {reportsLoading ? (
                  <div className="py-10 flex justify-center">
                    <Spinner color="primary" />
                  </div>
                ) : reports.length === 0 ? (
                  <p className="text-sm text-default-500">No hay denuncias para este filtro.</p>
                ) : (
                  <div className="space-y-2">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className="flex flex-col gap-3 rounded-xl border border-default-200 p-3 lg:flex-row lg:items-center lg:justify-between"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-[#0d212c]">
                              REP-{String(report.id).padStart(6, "0")}
                            </p>
                            <Chip size="sm" variant="flat">
                              {report.status}
                            </Chip>
                            <Chip size="sm" color="danger" variant="flat">
                              {report.aiSeverity || "UNKNOWN"}
                            </Chip>
                            <Chip size="sm" variant="flat">
                              {report.source}
                            </Chip>
                          </div>
                          <p className="mt-1 text-sm text-default-700">
                            {report.aiSummary || "Sin resumen disponible"}
                          </p>
                          <p className="text-xs text-default-500">
                            {report.isAnonymous
                              ? "Denunciante anónimo"
                              : report.reporterName || report.reporterEmail || "Sin datos de denunciante"}{" "}
                            · {new Date(report.submittedAt).toLocaleString("es-ES")}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button size="sm" variant="flat" onPress={() => openReportDetail(report.id)}>
                            Ver caso
                          </Button>
                          <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            isDisabled={actionLoading}
                            onPress={() =>
                              updateReportStatus(
                                report.id,
                                report.status === "IN_PROGRESS" ? "PENDING" : "IN_PROGRESS"
                              )
                            }
                          >
                            {report.status === "IN_PROGRESS" ? "Marcar pendiente" : "Marcar en progreso"}
                          </Button>
                          <Button
                            size="sm"
                            variant="flat"
                            color="success"
                            isDisabled={actionLoading}
                            onPress={() => updateReportStatus(report.id, "CLOSED")}
                          >
                            Cerrar
                          </Button>
                          <Button
                            size="sm"
                            variant="flat"
                            color="warning"
                            isDisabled={actionLoading}
                            onPress={() => updateReportStatus(report.id, "ARCHIVED")}
                          >
                            Archivar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="plan" title="Plan y facturación">
          <div className="space-y-4 mt-5">
            {loadingPlan ? (
              <div className="py-10 flex justify-center"><Spinner color="primary" /></div>
            ) : (
              <>
                <Card className="border border-emerald-200/60 bg-white/95">
                  <CardHeader className="flex items-center justify-between">
                    <h3 className="font-semibold text-[#0d212c]">Suscripción</h3>
                    <Button size="sm" variant="light" onPress={loadPlanData}>Refrescar</Button>
                  </CardHeader>
                  <CardBody>
                    {!subscription ? (
                      <p className="text-sm text-default-500">No hay suscripción activa.</p>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <Chip color="primary" variant="flat">{subscription.planName}</Chip>
                          <Chip color={subscription.status === "ACTIVE" ? "success" : "warning"} variant="flat">{subscription.status}</Chip>
                          <Chip variant="flat">{subscription.billingCycle === "YEARLY" ? "Anual" : "Mensual"}</Chip>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <SummaryKpi label="Admins límite" value={subscription.maxUsers} />
                          <SummaryKpi label="Investigadores límite" value={subscription.maxInvestigators} />
                          <SummaryKpi label="Empleados límite" value={subscription.maxEmployees} />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" color="warning" variant="flat" isDisabled={subscription.status === "PAUSED"} onPress={() => setPendingAction({ type: "pause-subscription", subscriptionId: subscription.id })}>Pausar</Button>
                          <Button size="sm" color="success" variant="flat" isDisabled={subscription.status === "ACTIVE"} onPress={() => setPendingAction({ type: "resume-subscription", subscriptionId: subscription.id })}>Reanudar</Button>
                          <Button size="sm" color="danger" variant="flat" onPress={() => setPendingAction({ type: "cancel-subscription", subscriptionId: subscription.id })}>Cancelar</Button>
                        </div>
                      </div>
                    )}
                  </CardBody>
                </Card>

                <Card className="border border-emerald-200/60 bg-white/95">
                  <CardHeader className="flex items-center justify-between">
                    <h3 className="font-semibold text-[#0d212c]">Cambio de plan</h3>
                    <div className="flex gap-2">
                      <Button size="sm" variant={targetBillingCycle === "MONTHLY" ? "solid" : "flat"} color="primary" onPress={() => setTargetBillingCycle("MONTHLY")}>Mensual</Button>
                      <Button size="sm" variant={targetBillingCycle === "YEARLY" ? "solid" : "flat"} color="primary" onPress={() => setTargetBillingCycle("YEARLY")}>Anual</Button>
                    </div>
                  </CardHeader>
                  <CardBody className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                    {(Object.keys(PLAN_CONFIGS) as PlanType[]).map((plan) => {
                      const cfg = PLAN_CONFIGS[plan];
                      const isCurrent = subscription?.planType === plan;
                      return (
                        <Card key={plan} className={`border ${isCurrent ? "border-emerald-300 bg-emerald-50/70" : "border-default-200 bg-white"}`}>
                          <CardBody className="space-y-2">
                            <p className="font-semibold text-[#0d212c]">{cfg.displayName}</p>
                            <p className="text-sm text-default-500">{targetBillingCycle === "YEARLY" ? cfg.price.yearly : cfg.price.monthly} {cfg.price.currency}</p>
                            <Button size="sm" color={isCurrent ? "success" : "primary"} variant={isCurrent ? "flat" : "solid"} isDisabled={isCurrent} onPress={() => setPendingAction({ type: "change-plan", targetPlan: plan })}>
                              {isCurrent ? "Plan actual" : "Cambiar"}
                            </Button>
                          </CardBody>
                        </Card>
                      );
                    })}
                  </CardBody>
                </Card>

                <Card className="border border-emerald-200/60 bg-white/95">
                  <CardHeader><h3 className="font-semibold text-[#0d212c]">Facturación reciente</h3></CardHeader>
                  <CardBody>
                    {billingItems.length === 0 ? <p className="text-sm text-default-500">Sin movimientos de facturación.</p> : (
                      <div className="space-y-2">
                        {billingItems.slice(0, 8).map((item) => (
                          <div key={item.id} className="flex items-center justify-between rounded-lg border border-default-200 px-3 py-2">
                            <div>
                              <p className="text-sm font-medium text-[#0d212c]">{item.description}</p>
                              <p className="text-xs text-default-500">{new Date(item.createdAt).toLocaleDateString("es-ES")}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">{item.amount} {item.currency}</p>
                              <Chip size="sm" variant="flat" color={String(item.status).toLowerCase() === "paid" ? "success" : "warning"}>{item.status}</Chip>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardBody>
                </Card>
              </>
            )}
          </div>
        </Tab>

        <Tab key="miembros" title="Miembros y permisos">
          <div className="space-y-4 mt-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <SummaryKpi label="Total" value={membersSummary.total} />
              <SummaryKpi label="Admins" value={membersSummary.admins} tone="primary" />
              <SummaryKpi label="Investigadores" value={membersSummary.investigators} tone="success" />
            </div>
            <Card className="border border-emerald-200/60 bg-white/95">
              <CardHeader className="flex items-center justify-between">
                <h3 className="font-semibold text-[#0d212c]">Gestión de miembros</h3>
                <Button size="sm" variant="light" onPress={loadMembers}>Refrescar</Button>
              </CardHeader>
              <CardBody>
                {loadingMembers ? <div className="py-10 flex justify-center"><Spinner color="primary" /></div> : (
                  <div className="space-y-2">
                    {members.map((member) => {
                      const name = `${member.user.firstName || ""} ${member.user.lastName || ""}`.trim() || member.user.email;
                      return (
                        <div key={member.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-xl border border-default-200 p-3">
                          <User name={name} description={member.user.email} avatarProps={{ name: name.charAt(0).toUpperCase(), size: "sm" }} />
                          <div className="flex flex-wrap items-center gap-2">
                            <Chip size="sm" color={member.role === "ADMIN" ? "primary" : "default"} variant="flat">{member.role}</Chip>
                            <Button size="sm" variant="flat" onPress={() => changeMemberRole(member.id, member.role === "ADMIN" ? "MEMBER" : "ADMIN")} isDisabled={actionLoading}>
                              Cambiar a {member.role === "ADMIN" ? "MEMBER" : "ADMIN"}
                            </Button>
                            <Button size="sm" color="danger" variant="light" onPress={() => setPendingAction({ type: "remove-member", memberId: member.id, memberName: name })} isDisabled={actionLoading}>
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    {members.length === 0 && <p className="text-sm text-default-500">No hay miembros en esta organización.</p>}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="analitica" title="Analítica">
          <div className="space-y-4 mt-5">
            {loadingAnalytics ? (
              <div className="py-10 flex justify-center"><Spinner color="primary" /></div>
            ) : analytics ? (
              <>
                <StatsCards stats={analytics.stats} />
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <StatisticsChart chartData={analytics.chartData} totalReports={analytics.stats.totalReports} />
                  <WeeklyTrendChart weeklyData={analytics.weeklyTrend} />
                </div>
                <SeverityIndicator distribution={analytics.severityDistribution} />
              </>
            ) : (
              <Card><CardBody><p className="text-sm text-default-500">No se pudo cargar la analítica.</p></CardBody></Card>
            )}
          </div>
        </Tab>
      </Tabs>

      {pendingAction && confirmMeta && (
        <ConfirmActionModal
          isOpen={Boolean(pendingAction)}
          title={confirmMeta.title}
          description={confirmMeta.description}
          confirmLabel={confirmMeta.confirmLabel}
          riskLevel={confirmMeta.riskLevel}
          isLoading={actionLoading}
          onClose={() => setPendingAction(null)}
          onConfirm={runPendingAction}
        />
      )}
    </SuperAdminPanelShell>
  );
}

function SummaryKpi({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "primary" | "success" | "warning";
}) {
  const colorMap: Record<string, string> = {
    default: "text-[#0d212c]",
    primary: "text-primary-600",
    success: "text-emerald-600",
    warning: "text-amber-600",
  };
  return (
    <Card className="border border-emerald-200/60 bg-white/95">
      <CardBody>
        <p className="text-xs font-semibold uppercase tracking-wide text-default-500">{label}</p>
        <p className={`mt-2 text-2xl font-semibold ${colorMap[tone]}`}>{value}</p>
      </CardBody>
    </Card>
  );
}

