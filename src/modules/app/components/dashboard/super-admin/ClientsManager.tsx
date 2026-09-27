"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Radio,
  RadioGroup,
  Switch,
} from "@heroui/react";
import { showError, showSuccess } from "@/modules/core/utils/safe-toast";
import { PLAN_CONFIGS, PlanType } from "@/types/subscription.types";
import { MetricStrip } from "@/modules/app/components/ui";

type Client = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  isActive: boolean;
  plan: PlanType | null;
  subscription: { id: number; status: string; endDate: string | null; billing: "mercadopago" | "manual" } | null;
  adminEmail: string | null;
  adminPending: boolean;
  members: number;
  reports: number;
  emailChannel: { address: string; active: boolean } | null;
};

const PLANS: PlanType[] = [PlanType.STARTER, PlanType.GROW, PlanType.GROW_PRO, PlanType.PREMIUM];
const planName = (p: PlanType | null) => (p ? PLAN_CONFIGS[p]?.displayName.replace("EthicVoice ", "") ?? p : "Sin plan");
const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" }) : "";

function statusOf(c: Client): { label: string; tone: string; hint?: string } {
  if (!c.isActive) return { label: "Acceso suspendido", tone: "bg-[#FBE6E1] text-[#9C2F1F]" };
  const s = c.subscription;
  if (!s) return { label: "Sin suscripción", tone: "bg-ev-bone text-ev-mute", hint: "Asígnale un plan" };
  switch (s.status) {
    case "ACTIVE":
      return { label: "Activa", tone: "bg-ev-signal-wash text-ev-moss" };
    case "TRIALING":
      return { label: "En prueba", tone: "bg-[#E4ECEC] text-ev-slate" };
    case "INACTIVE":
      return { label: "Cobro pausado", tone: "bg-[#FBF0DC] text-[#8C5C15]" };
    case "PAST_DUE":
      return { label: "Pago pendiente", tone: "bg-[#FBF0DC] text-[#8C5C15]" };
    case "CANCELED":
      return {
        label: "Cancelada",
        tone: "bg-ev-bone text-ev-mute",
        hint: s.endDate ? `Acceso hasta ${fmtDate(s.endDate)}` : undefined,
      };
    default:
      return { label: s.status, tone: "bg-ev-bone text-ev-mute" };
  }
}

async function call(method: string, url: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "La operación no se pudo completar");
  return data;
}

type Dialog =
  | { kind: "create" }
  | { kind: "created"; result: { adminEmail: string; tempPassword: string | null; adminStatus: string; warnings?: string[]; orgName: string } }
  | { kind: "plan"; client: Client }
  | { kind: "edit"; client: Client }
  | { kind: "subscription"; client: Client; action: "pause" | "resume" | "cancel" }
  | { kind: "delete"; client: Client }
  | null;

export function ClientsManager() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await call("GET", "/api/superadmin/clients");
      setClients(data.organizations || []);
    } catch (e) {
      showError("No se pudo cargar la lista de clientes", e instanceof Error ? e.message : undefined);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.adminEmail || "").toLowerCase().includes(q),
    );
  }, [clients, query]);

  const counts = useMemo(
    () => ({
      total: clients.length,
      active: clients.filter((c) => c.isActive && c.subscription?.status === "ACTIVE").length,
      attention: clients.filter(
        (c) => !c.subscription || ["INACTIVE", "PAST_DUE", "CANCELED"].includes(c.subscription.status) || !c.isActive,
      ).length,
      reports: clients.reduce((s, c) => s + c.reports, 0),
    }),
    [clients],
  );

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      showError("No se pudo completar", e instanceof Error ? e.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  const openAsOrg = (c: Client, path: string) => {
    document.cookie = `ev_scope=org; path=/; max-age=${60 * 60 * 24 * 30}`;
    document.cookie = `ev_org=${c.id}; path=/; max-age=${60 * 60 * 24 * 30}`;
    window.dispatchEvent(new Event("ev-scope-changed"));
    window.location.href = path;
  };

  return (
    <div className="space-y-6">
      <MetricStrip
        size="md"
        metrics={[
          { key: "total", label: "Clientes", value: counts.total, tone: "slate" },
          { key: "active", label: "Con suscripción activa", value: counts.active, tone: "moss" },
          { key: "attention", label: "Requieren revisión", value: counts.attention, tone: "amber", caption: "Sin plan, pausados, cancelados o suspendidos" },
          { key: "reports", label: "Denuncias en total", value: counts.reports, tone: "haze" },
        ]}
      />

      <section className="rounded-2xl border border-ev-line bg-white">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ev-line px-5 py-4">
          <Input
            aria-label="Buscar cliente"
            placeholder="Buscar por nombre o correo del administrador"
            value={query}
            onValueChange={setQuery}
            size="sm"
            className="max-w-sm"
            startContent={<i className="icon-[lucide--search] size-4 text-ev-haze" aria-hidden />}
          />
          <div className="flex items-center gap-2">
            <Button variant="light" size="sm" onPress={load} isDisabled={loading} startContent={<i className="icon-[lucide--refresh-ccw] size-4" />}>
              Actualizar
            </Button>
            <Button
              size="sm"
              className="bg-ev-night font-medium text-white"
              onPress={() => setDialog({ kind: "create" })}
              startContent={<i className="icon-[lucide--plus] size-4" />}
            >
              Nuevo cliente
            </Button>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-sm text-ev-mute">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-ev-line border-t-ev-night" />
            Cargando clientes…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-medium text-ev-night">{query ? "Ningún cliente coincide con la búsqueda" : "Aún no hay clientes"}</p>
            <p className="mt-1 text-sm text-ev-mute">
              {query ? "Prueba con otro nombre o correo." : "Crea el primero con “Nuevo cliente”."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-ev-line text-left text-ev-mute">
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Plan</th>
                  <th className="px-5 py-3 font-medium">Suscripción</th>
                  <th className="px-5 py-3 font-medium">Canal por correo</th>
                  <th className="px-5 py-3 text-right font-medium">Usuarios</th>
                  <th className="px-5 py-3 text-right font-medium">Denuncias</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ev-line">
                {filtered.map((c) => {
                  const st = statusOf(c);
                  return (
                    <tr key={c.id} className="align-top hover:bg-ev-paper/50">
                      <td className="px-5 py-4">
                        <Link href={`/app/organizations/${c.id}`} className="font-medium text-ev-night hover:underline">
                          {c.name}
                        </Link>
                        <p className="mt-0.5 text-xs text-ev-mute">
                          {c.adminEmail ? (
                            <>
                              {c.adminEmail}
                              {c.adminPending ? " · invitación pendiente" : ""}
                            </>
                          ) : (
                            <span className="text-[#8C5C15]">Sin administrador</span>
                          )}
                        </p>
                        <p className="mt-0.5 text-xs text-ev-haze">Desde {fmtDate(c.createdAt)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-ev-night">{planName(c.plan)}</p>
                        {c.subscription && (
                          <p className="mt-0.5 text-xs text-ev-mute">
                            {c.subscription.billing === "mercadopago" ? "Cobro por Mercado Pago" : "Contrato manual"}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${st.tone}`}>{st.label}</span>
                        {st.hint && <p className="mt-1 text-xs text-ev-mute">{st.hint}</p>}
                      </td>
                      <td className="px-5 py-4 text-xs">
                        {c.emailChannel ? (
                          <>
                            <p className="text-ev-night">{c.emailChannel.address}</p>
                            <p className={c.emailChannel.active ? "text-ev-moss" : "text-ev-mute"}>
                              {c.emailChannel.active ? "Recibiendo denuncias" : "Creada, sin activar"}
                            </p>
                          </>
                        ) : (
                          <span className="text-ev-haze">No configurado</span>
                        )}
                      </td>
                      <td className="ev-num px-5 py-4 text-right text-ev-night">{c.members}</td>
                      <td className="ev-num px-5 py-4 text-right text-ev-night">{c.reports}</td>
                      <td className="px-5 py-4 text-right">
                        <Dropdown placement="bottom-end">
                          <DropdownTrigger>
                            <Button size="sm" variant="light" className="text-ev-night" endContent={<i className="icon-[lucide--chevron-down] size-4" />}>
                              Acciones
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu
                            aria-label={`Acciones para ${c.name}`}
                            onAction={(key) => {
                              const k = String(key);
                              if (k === "detail") window.location.href = `/app/organizations/${c.id}`;
                              else if (k === "enter") openAsOrg(c, "/app/reports");
                              else if (k === "email") openAsOrg(c, "/app/email");
                              else if (k === "link") {
                                navigator.clipboard.writeText(`${window.location.origin}/submit/${c.slug}`);
                                showSuccess("Enlace copiado", "Es el formulario público de denuncias del cliente.");
                              } else if (k === "plan") setDialog({ kind: "plan", client: c });
                              else if (k === "edit") setDialog({ kind: "edit", client: c });
                              else if (k === "pause" || k === "resume" || k === "cancel")
                                setDialog({ kind: "subscription", client: c, action: k });
                              else if (k === "delete") setDialog({ kind: "delete", client: c });
                            }}
                            disabledKeys={[
                              ...(c.subscription?.status !== "ACTIVE" ? ["pause"] : []),
                              ...(c.subscription?.status !== "INACTIVE" ? ["resume"] : []),
                              ...(!c.subscription || c.subscription.status === "CANCELED" ? ["cancel"] : []),
                            ]}
                          >
                            <DropdownSection title="Ver" showDivider>
                              <DropdownItem key="detail" description="Miembros, plan, facturación y denuncias">Detalle del cliente</DropdownItem>
                              <DropdownItem key="enter" description="Ver el panel como lo ve el cliente">Entrar a sus denuncias</DropdownItem>
                              <DropdownItem key="email" description="Crear o activar la bandeja de denuncias">Bandeja de correo</DropdownItem>
                              <DropdownItem key="link">Copiar enlace del formulario</DropdownItem>
                            </DropdownSection>
                            <DropdownSection title="Administrar" showDivider>
                              <DropdownItem key="plan">Cambiar plan</DropdownItem>
                              <DropdownItem key="edit">Editar nombre o acceso</DropdownItem>
                              <DropdownItem key="pause" description="Detiene los cobros; mantiene el acceso">Pausar cobro</DropdownItem>
                              <DropdownItem key="resume">Reanudar cobro</DropdownItem>
                              <DropdownItem key="cancel" description="Acceso hasta el fin del periodo pagado">Cancelar suscripción</DropdownItem>
                            </DropdownSection>
                            <DropdownSection>
                              <DropdownItem key="delete" className="text-[#B23A28]" color="danger">
                                Eliminar cliente
                              </DropdownItem>
                            </DropdownSection>
                          </DropdownMenu>
                        </Dropdown>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {dialog?.kind === "create" && (
        <CreateClientDialog
          busy={busy}
          onClose={() => setDialog(null)}
          onSubmit={(form) =>
            run(async () => {
              const data = await call("POST", "/api/superadmin/manual-create-client", form);
              setDialog({ kind: "created", result: { ...data, orgName: form.organizationName } });
              await load();
            })
          }
        />
      )}

      {dialog?.kind === "created" && <CreatedDialog result={dialog.result} onClose={() => setDialog(null)} />}

      {dialog?.kind === "plan" && (
        <PlanDialog
          client={dialog.client}
          busy={busy}
          onClose={() => setDialog(null)}
          onSubmit={(planType) =>
            run(async () => {
              const data = await call("POST", `/api/superadmin/organizations/${dialog.client.id}/plan`, { planType });
              showSuccess("Plan actualizado", `${dialog.client.name} ahora tiene el plan ${planName(planType)}.`);
              (data.warnings || []).forEach((w: string) => showError("Atención", w));
              setDialog(null);
              await load();
            })
          }
        />
      )}

      {dialog?.kind === "edit" && (
        <EditDialog
          client={dialog.client}
          busy={busy}
          onClose={() => setDialog(null)}
          onSubmit={(patch) =>
            run(async () => {
              await call("PATCH", `/api/superadmin/organizations/${dialog.client.id}`, patch);
              showSuccess("Cambios guardados");
              setDialog(null);
              await load();
            })
          }
        />
      )}

      {dialog?.kind === "subscription" && dialog.client.subscription && (
        <SubscriptionDialog
          client={dialog.client}
          action={dialog.action}
          busy={busy}
          onClose={() => setDialog(null)}
          onConfirm={() =>
            run(async () => {
              await call("POST", `/api/superadmin/subscriptions/${dialog.action}`, {
                subscriptionId: dialog.client.subscription!.id,
              });
              showSuccess(
                dialog.action === "pause" ? "Cobro pausado" : dialog.action === "resume" ? "Cobro reanudado" : "Suscripción cancelada",
              );
              setDialog(null);
              await load();
            })
          }
        />
      )}

      {dialog?.kind === "delete" && (
        <DeleteDialog
          client={dialog.client}
          busy={busy}
          onClose={() => setDialog(null)}
          onConfirm={(confirmName) =>
            run(async () => {
              const data = await call("DELETE", `/api/superadmin/organizations/${dialog.client.id}`, { confirmName });
              showSuccess("Cliente eliminado", `${dialog.client.name} y todos sus datos fueron eliminados.`);
              (data.warnings || []).forEach((w: string) => showError("Atención", w));
              setDialog(null);
              await load();
            })
          }
        />
      )}
    </div>
  );
}

// ─── Diálogos ──────────────────────────────────────────────────────────────

function PlanPicker({ value, onChange }: { value: PlanType; onChange: (p: PlanType) => void }) {
  return (
    <RadioGroup value={value} onValueChange={(v) => onChange(v as PlanType)} aria-label="Plan">
      {PLANS.map((p) => {
        const cfg = PLAN_CONFIGS[p];
        const price = cfg.price.monthly ? `US$${cfg.price.monthly}/mes` : "Precio a medida";
        const users = cfg.features.maxInvestigators === -1 ? "investigadores ilimitados" : `${cfg.features.maxInvestigators} investigadores`;
        return (
          <Radio key={p} value={p} description={`${price} · ${cfg.features.maxUsers === -1 ? "admins ilimitados" : `${cfg.features.maxUsers} admin(s)`} · ${users}${cfg.features.hasEmailChannel ? " · canal por correo" : ""}`}>
            {planName(p)}
          </Radio>
        );
      })}
    </RadioGroup>
  );
}

function CreateClientDialog({
  busy,
  onClose,
  onSubmit,
}: {
  busy: boolean;
  onClose: () => void;
  onSubmit: (f: { organizationName: string; name: string; email: string; planType: PlanType; mode: "create" | "invite" }) => void;
}) {
  const [organizationName, setOrg] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [planType, setPlan] = useState<PlanType>(PlanType.STARTER);
  const [mode, setMode] = useState<"create" | "invite">("create");
  const valid = organizationName.trim().length > 1 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  return (
    <Modal isOpen onClose={onClose} size="2xl" scrollBehavior="inside" isDismissable={!busy}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          Nuevo cliente
          <span className="text-sm font-normal text-ev-mute">
            Crea la organización, su administrador y le asigna un plan. No se genera ningún cobro.
          </span>
        </ModalHeader>
        <ModalBody className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Nombre de la organización" value={organizationName} onValueChange={setOrg} isRequired autoFocus className="sm:col-span-2" />
            <Input label="Nombre del administrador" value={name} onValueChange={setName} description="Opcional" />
            <Input label="Correo del administrador" type="email" value={email} onValueChange={setEmail} isRequired />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-ev-night">Plan</p>
            <PlanPicker value={planType} onChange={setPlan} />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-ev-night">Acceso del administrador</p>
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as "create" | "invite")} aria-label="Acceso">
              <Radio value="create" description="Te mostramos una contraseña temporal para que se la compartas.">
                Crear la cuenta ahora
              </Radio>
              <Radio value="invite" description="Le llega un correo para aceptar y crear su contraseña.">
                Enviar invitación por correo
              </Radio>
            </RadioGroup>
            <p className="mt-2 text-xs text-ev-mute">Si el correo ya tiene cuenta en EthicVoice, solo se le da acceso a esta organización.</p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={busy}>
            Cancelar
          </Button>
          <Button
            className="bg-ev-night font-medium text-white"
            isDisabled={!valid}
            isLoading={busy}
            onPress={() => onSubmit({ organizationName: organizationName.trim(), name: name.trim(), email: email.trim(), planType, mode })}
          >
            Crear cliente
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function CreatedDialog({
  result,
  onClose,
}: {
  result: { adminEmail: string; tempPassword: string | null; adminStatus: string; warnings?: string[]; orgName: string };
  onClose: () => void;
}) {
  return (
    <Modal isOpen onClose={onClose} size="lg">
      <ModalContent>
        <ModalHeader>Cliente creado</ModalHeader>
        <ModalBody className="space-y-4 text-sm">
          <p className="text-ev-night">
            <strong>{result.orgName}</strong> ya está lista.
          </p>
          {result.adminStatus === "created" && result.tempPassword && (
            <div className="rounded-xl border border-ev-line bg-ev-paper p-4">
              <p className="text-ev-mute">Comparte estos datos de acceso con el administrador (solo se muestran esta vez):</p>
              <dl className="mt-3 space-y-2">
                <div className="flex justify-between gap-3">
                  <dt className="text-ev-mute">Correo</dt>
                  <dd className="font-mono text-ev-night">{result.adminEmail}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ev-mute">Contraseña temporal</dt>
                  <dd className="flex items-center gap-2">
                    <span className="font-mono text-ev-night">{result.tempPassword}</span>
                    <Button
                      size="sm"
                      variant="light"
                      onPress={() => {
                        navigator.clipboard.writeText(`Correo: ${result.adminEmail}\nContraseña temporal: ${result.tempPassword}`);
                        showSuccess("Datos copiados");
                      }}
                    >
                      Copiar
                    </Button>
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-ev-mute">Recomiéndale cambiarla desde su perfil al entrar.</p>
            </div>
          )}
          {result.adminStatus === "existing" && (
            <p className="text-ev-mute">{result.adminEmail} ya tenía cuenta: ahora es administrador de esta organización.</p>
          )}
          {result.adminStatus === "invited" && (
            <p className="text-ev-mute">Enviamos la invitación a {result.adminEmail}. Vence en 7 días.</p>
          )}
          {(result.warnings || []).map((w) => (
            <p key={w} className="rounded-lg bg-[#FBF0DC] px-3 py-2 text-[#8C5C15]">
              {w}
            </p>
          ))}
        </ModalBody>
        <ModalFooter>
          <Button className="bg-ev-night font-medium text-white" onPress={onClose}>
            Listo
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function PlanDialog({ client, busy, onClose, onSubmit }: { client: Client; busy: boolean; onClose: () => void; onSubmit: (p: PlanType) => void }) {
  const [plan, setPlan] = useState<PlanType>(client.plan ?? PlanType.STARTER);
  const mp = client.subscription?.billing === "mercadopago";
  return (
    <Modal isOpen onClose={onClose} size="lg" isDismissable={!busy}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          Cambiar plan
          <span className="text-sm font-normal text-ev-mute">{client.name} · hoy: {planName(client.plan)}</span>
        </ModalHeader>
        <ModalBody className="space-y-4">
          <PlanPicker value={plan} onChange={setPlan} />
          <p className="rounded-lg bg-ev-paper px-3 py-2 text-sm text-ev-mute">
            {mp
              ? "Este cliente paga con Mercado Pago: el próximo cobro se hará con el precio del nuevo plan."
              : "Contrato manual: el cambio es inmediato y no genera ningún cobro."}{" "}
            Si el nuevo plan permite menos usuarios, los que excedan el cupo quedarán bloqueados.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={busy}>
            Cancelar
          </Button>
          <Button className="bg-ev-night font-medium text-white" isLoading={busy} isDisabled={plan === client.plan && client.subscription?.status === "ACTIVE"} onPress={() => onSubmit(plan)}>
            Aplicar plan {planName(plan)}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function EditDialog({
  client,
  busy,
  onClose,
  onSubmit,
}: {
  client: Client;
  busy: boolean;
  onClose: () => void;
  onSubmit: (p: { name?: string; isActive?: boolean }) => void;
}) {
  const [name, setName] = useState(client.name);
  const [active, setActive] = useState(client.isActive);
  const patch: { name?: string; isActive?: boolean } = {};
  if (name.trim() !== client.name) patch.name = name.trim();
  if (active !== client.isActive) patch.isActive = active;
  return (
    <Modal isOpen onClose={onClose} size="lg" isDismissable={!busy}>
      <ModalContent>
        <ModalHeader>Editar cliente</ModalHeader>
        <ModalBody className="space-y-5">
          <Input label="Nombre de la organización" value={name} onValueChange={setName} />
          <div className="flex items-start justify-between gap-4 rounded-xl border border-ev-line p-4">
            <div>
              <p className="text-sm font-medium text-ev-night">Acceso al panel</p>
              <p className="mt-0.5 text-sm text-ev-mute">
                Si lo suspendes, los usuarios del cliente no podrán entrar al panel. Sus datos no se borran.
              </p>
            </div>
            <Switch isSelected={active} onValueChange={setActive} aria-label="Acceso al panel" />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={busy}>
            Cancelar
          </Button>
          <Button className="bg-ev-night font-medium text-white" isLoading={busy} isDisabled={Object.keys(patch).length === 0} onPress={() => onSubmit(patch)}>
            Guardar cambios
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function SubscriptionDialog({
  client,
  action,
  busy,
  onClose,
  onConfirm,
}: {
  client: Client;
  action: "pause" | "resume" | "cancel";
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const mp = client.subscription?.billing === "mercadopago";
  const copy = {
    pause: {
      title: "Pausar cobro",
      body: mp
        ? "Mercado Pago dejará de cobrar hasta que lo reanudes. El cliente conserva el acceso."
        : "Se marca la suscripción como pausada. El cliente conserva el acceso.",
      cta: "Pausar cobro",
    },
    resume: {
      title: "Reanudar cobro",
      body: mp ? "Mercado Pago volverá a cobrar en la próxima fecha de pago." : "La suscripción vuelve a quedar activa.",
      cta: "Reanudar cobro",
    },
    cancel: {
      title: "Cancelar suscripción",
      body: `${mp ? "Se cancela el cobro en Mercado Pago. " : ""}El cliente conserva el acceso hasta el fin del periodo ya pagado; después quedará sin plan activo.`,
      cta: "Cancelar suscripción",
    },
  }[action];
  return (
    <Modal isOpen onClose={onClose} isDismissable={!busy}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {copy.title}
          <span className="text-sm font-normal text-ev-mute">{client.name}</span>
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-ev-ink">{copy.body}</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={busy}>
            Volver
          </Button>
          <Button className={action === "cancel" ? "bg-ev-coral font-medium text-white" : "bg-ev-night font-medium text-white"} isLoading={busy} onPress={onConfirm}>
            {copy.cta}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function DeleteDialog({ client, busy, onClose, onConfirm }: { client: Client; busy: boolean; onClose: () => void; onConfirm: (name: string) => void }) {
  const [typed, setTyped] = useState("");
  return (
    <Modal isOpen onClose={onClose} isDismissable={!busy}>
      <ModalContent>
        <ModalHeader>Eliminar cliente</ModalHeader>
        <ModalBody className="space-y-4 text-sm">
          <div className="rounded-xl border border-[#F0B2A6] bg-[#FCEEEB] p-4 text-[#862B1D]">
            <p className="font-medium">Esto no se puede deshacer.</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Se borran sus {client.reports} denuncias, miembros, formularios y configuración.</li>
              {client.subscription?.billing === "mercadopago" && <li>Se cancela su cobro en Mercado Pago.</li>}
              {client.emailChannel && <li>Se elimina la bandeja {client.emailChannel.address}.</li>}
              <li>Las cuentas de sus usuarios siguen existiendo, pero sin acceso a esta organización.</li>
            </ul>
          </div>
          <Input
            label={`Escribe “${client.name}” para confirmar`}
            value={typed}
            onValueChange={setTyped}
            autoFocus
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={busy}>
            Cancelar
          </Button>
          <Button className="bg-ev-coral font-medium text-white" isLoading={busy} isDisabled={typed.trim() !== client.name.trim()} onPress={() => onConfirm(typed)}>
            Eliminar definitivamente
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
