"use client";

import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import Link from "next/link";

interface OrganizationCardProps {
  organization: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    _count: {
      forms: number;
      complaints: number;
      memberships: number;
    };
    stats: {
      pendingReports: number;
      resolvedReports: number;
      highSeverityReports: number;
    };
  };
}

export function OrganizationCard({ organization }: OrganizationCardProps) {
  return (
    <Card className="border border-emerald-200/60 bg-white/90 shadow-sm transition hover:shadow-md">
      <CardHeader className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-[#0d212c]">{organization.name}</h3>
          <p className="text-sm text-default-500">{organization.slug}</p>
        </div>
        <Chip
          color={organization.isActive ? "success" : "danger"}
          size="sm"
          variant="flat"
        >
          {organization.isActive ? "Activa" : "Inactiva"}
        </Chip>
      </CardHeader>
      <CardBody>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-default-600">Usuarios</p>
              <p className="font-semibold">{organization._count.memberships}</p>
            </div>
            <div>
              <p className="text-default-600">Formularios</p>
              <p className="font-semibold">{organization._count.forms}</p>
            </div>
            <div>
              <p className="text-default-600">Reportes</p>
              <p className="font-semibold">{organization._count.complaints}</p>
            </div>
            <div>
              <p className="text-default-600">Pendientes</p>
              <p className="font-semibold text-yellow-600">
                {organization.stats.pendingReports}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
              as={Link}
              href={`/app/organizations/${organization.id}?section=resumen`}
              variant="flat"
              color="primary"
              size="sm"
            >
              Resumen
            </Button>
            <Button
              as={Link}
              href={`/app/organizations/${organization.id}?section=plan`}
              variant="flat"
              size="sm"
            >
              Plan y facturación
            </Button>
            <Button
              as={Link}
              href={`/app/organizations/${organization.id}?section=miembros`}
              variant="flat"
              size="sm"
            >
              Miembros
            </Button>
            <Button
              as={Link}
              href={`/app/organizations/${organization.id}?section=analitica`}
              variant="flat"
              size="sm"
            >
              Analítica
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
