/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { User } from "@heroui/user";
import { Chip } from "@heroui/chip";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface MemberDetailsViewProps {
  data: {
    member: any;
    stats: any;
    recentReports: any[];
    weeklyPerformance: any[];
  };
}

export function MemberDetailsView({ data }: MemberDetailsViewProps) {
  const { member, stats, recentReports, weeklyPerformance } = data;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          as={Link}
          href="/app/team"
          variant="light"
          startContent={<i className="icon-[lucide--arrow-left] size-4" />}
        >
          Volver al Equipo
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Detalles del Investigador
          </h1>
          <p className="text-gray-600">Rendimiento y estadísticas detalladas</p>
        </div>
      </div>

      {/* Member Info Card */}
      <Card>
        <CardBody className="p-6">
          <div className="flex items-center justify-between">
            <User
              name={member.userName}
              description={member.user.email}
              avatarProps={{
                name: member.userName[0],
                size: "lg",
              }}
            />
            <Chip
              color={member.role === "ADMIN" ? "primary" : "default"}
              variant="flat"
            >
              {member.role === "ADMIN" ? "Administrador" : "Investigador"}
            </Chip>
          </div>
        </CardBody>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Asignados</p>
                <p className="text-2xl font-bold">{stats.totalAssigned}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <i className="icon-[lucide--briefcase] size-6 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resueltos</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.totalResolved}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <i className="icon-[lucide--check-circle] size-6 text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tiempo Promedio</p>
                <p className="text-2xl font-bold">
                  {stats.averageResolutionDays} días
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <i className="icon-[lucide--clock] size-6 text-purple-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tasa de Resolución</p>
                <p className="text-2xl font-bold">
                  {(stats.resolutionRate ?? 0).toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <i className="icon-[lucide--trending-up] size-6 text-orange-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Rendimiento Semanal</h3>
        </CardHeader>
        <CardBody>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dayName" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  stroke="#10b981"
                  name="Resueltos"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="assigned"
                  stroke="#3b82f6"
                  name="Asignados"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Reportes Recientes</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {recentReports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">
                    #LIN-{report.id.toString().padStart(3, "0")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(report.submittedAt).toLocaleDateString("es-ES")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Chip
                    size="sm"
                    color={
                      report.status === "RESOLVED"
                        ? "success"
                        : report.status === "IN_PROGRESS"
                          ? "primary"
                          : "warning"
                    }
                    variant="flat"
                  >
                    {report.status}
                  </Chip>
                  <Button
                    as={Link}
                    href={`/app/reports/${report.id}`}
                    size="sm"
                    variant="light"
                    isIconOnly
                  >
                    <i className="icon-[lucide--arrow-right] size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
