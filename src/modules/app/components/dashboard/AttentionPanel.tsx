"use client";

import Link from "next/link";
import type { DashboardData } from "@/types/dashboard.types";
import { getDeadlineInfo } from "../../utils/dashboard.utils";

type Item = {
  key: string;
  count: number;
  title: string;
  hint: string;
  href: string;
  tone: "coral" | "amber" | "slate";
};

const DOT = { coral: "bg-ev-coral", amber: "bg-ev-amber", slate: "bg-ev-slate" } as const;

/**
 * "Lo que requiere tu atención": traduce las cifras del día en tareas
 * concretas, en lenguaje simple, con un enlace a la lista ya filtrada.
 * Pensado para oficiales de cumplimiento que no quieren interpretar gráficos
 * para saber qué hacer.
 */
export function AttentionPanel({ data }: { data: DashboardData }) {
  const overdue = data.recentReports.filter((r) => {
    if (r.status === "closed" || r.status === "archived") return false;
    return getDeadlineInfo(r.severity, new Date(r.submittedAt), r.category).isOverdue;
  }).length;

  const items: Item[] = [
    {
      key: "overdue",
      count: overdue,
      title: overdue === 1 ? "denuncia con el plazo vencido" : "denuncias con el plazo vencido",
      hint: "Ya superaron el tiempo de respuesta. Priorízalas o registra por qué se extienden.",
      href: "/app/reports?sla=red",
      tone: "coral",
    },
    {
      key: "critical",
      count: data.stats.criticalReports ?? 0,
      title: (data.stats.criticalReports ?? 0) === 1 ? "denuncia prioritaria" : "denuncias prioritarias",
      hint: "Prioridad alta o urgente, o severidad alta (fraude, soborno, riesgo para personas). Revísalas primero.",
      href: "/app/reports?priority=URGENT",
      tone: "coral",
    },
    {
      key: "new",
      count: data.stats.newReports ?? 0,
      title: (data.stats.newReports ?? 0) === 1 ? "denuncia nueva por revisar" : "denuncias nuevas por revisar",
      hint: "Léelas, confirma la categoría y asigna a un responsable.",
      href: "/app/reports?status=PENDING",
      tone: "amber",
    },
  ].filter((i) => i.count > 0) as Item[];

  if (items.length === 0) {
    return (
      <section className="flex items-center gap-4 rounded-2xl border border-ev-line bg-white px-6 py-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ev-signal-wash text-ev-moss">
          <i className="icon-[lucide--check] size-4" aria-hidden />
        </span>
        <div>
          <p className="font-medium text-ev-night">Todo al día</p>
          <p className="text-sm text-ev-mute">
            No hay denuncias vencidas, urgentes ni pendientes de revisión.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="attention-title" className="rounded-2xl border border-ev-line bg-white">
      <header className="flex items-center justify-between border-b border-ev-line px-6 py-4">
        <h2 id="attention-title" className="text-base font-semibold tracking-[-0.015em] text-ev-night">
          Lo que requiere tu atención
        </h2>
        <span className="ev-label text-ev-mute">Hoy</span>
      </header>
      <ul className="divide-y divide-ev-line">
        {items.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              className="group flex items-center gap-5 px-6 py-4 transition-colors hover:bg-ev-paper/60"
            >
              <span className="ev-num w-12 shrink-0 text-[2rem] font-semibold leading-none text-ev-night">
                {item.count}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-medium text-ev-night">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[item.tone]}`} aria-hidden />
                  {item.title}
                </span>
                <span className="mt-0.5 block text-sm text-ev-mute">{item.hint}</span>
              </span>
              <span className="hidden shrink-0 items-center gap-1.5 text-sm font-medium text-ev-night sm:flex">
                Ver
                <i
                  className="icon-[lucide--arrow-right] size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
