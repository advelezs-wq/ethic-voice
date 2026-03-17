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
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">{organization.name}</h3>
          <p className="text-sm text-gray-500">{organization.slug}</p>
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
              <p className="text-gray-600">Usuarios</p>
              <p className="font-semibold">{organization._count.memberships}</p>
            </div>
            <div>
              <p className="text-gray-600">Formularios</p>
              <p className="font-semibold">{organization._count.forms}</p>
            </div>
            <div>
              <p className="text-gray-600">Reportes</p>
              <p className="font-semibold">{organization._count.complaints}</p>
            </div>
            <div>
              <p className="text-gray-600">Pendientes</p>
              <p className="font-semibold text-yellow-600">
                {organization.stats.pendingReports}
              </p>
            </div>
          </div>

          <Button
            as={Link}
            href={`/app/organizations/${organization.id}`}
            variant="flat"
            color="primary"
            size="sm"
            className="w-full"
          >
            Ver Detalles
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
