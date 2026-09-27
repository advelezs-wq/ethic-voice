/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { MetricStrip } from "@/modules/app/components/ui";

import React, { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { User } from "@heroui/user";
import { Progress } from "@heroui/progress";
import { Chip } from "@heroui/chip";
import { useDisclosure } from "@heroui/react";
import Link from "next/link";
import { getTeamMembers } from "@/actions/team.actions";
import { getDepartments } from "@/actions/department.actions";
import { AssignDepartmentModal } from "../../team/AssignDepartmentModal";
import { Department } from "@/types/department.types";

interface EnhancedTeamMembersViewProps {
  organizationId: string;
}

interface TeamMember {
  userId: string;
  userName: string;
  email: string;
  role: "ADMIN" | "MEMBER" | "VIEWER";
  departmentId?: string;
  departmentName?: string;
  assignedReports: number;
  completedReports: number;
  inProgressReports: number;
  pendingReports: number;
  performanceScore: number;
}

export function TeamMembersView({
  organizationId,
}: EnhancedTeamMembersViewProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const assignModal = useDisclosure();

  useEffect(() => {
    async function loadData() {
      try {
        const [membersData, departmentsData] = await Promise.all([
          getTeamMembers(organizationId),
          getDepartments(organizationId),
        ]);

        // Enhance members with department information
        const enhancedMembers = membersData.map((member: any) => {
          const department = departmentsData.find(
            (dept) => dept.id === member.departmentId
          );
          return {
            ...member,
            departmentName: department?.name || "Sin Departamento",
          };
        });

        setMembers(enhancedMembers);
        setDepartments(departmentsData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [organizationId]);

  const handleAssignDepartment = (member: TeamMember) => {
    setSelectedMember(member);
    assignModal.onOpen();
  };

  const refreshData = async () => {
    setLoading(true);
    const [membersData, departmentsData] = await Promise.all([
      getTeamMembers(organizationId),
      getDepartments(organizationId),
    ]);

    const enhancedMembers = membersData.map((member: any) => {
      const department = departmentsData.find(
        (dept) => dept.id === member.departmentId
      );
      return {
        ...member,
        departmentName: department?.name || "Sin Departamento",
      };
    });

    setMembers(enhancedMembers);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  const admins = members.filter((m) => m.role === "ADMIN");
  const regularMembers = members.filter((m) => m.role === "MEMBER");
  const viewers = members.filter((m) => m.role === "VIEWER");

  return (
    <div className="space-y-6">
      <section className="ev-page-hero">
        <p className="ev-page-hero-kicker">Equipo</p>
        <h1 className="ev-page-hero-title">Equipo</h1>
        <p className="ev-page-hero-description">
          Quién trabaja en tu canal de denuncias, con qué rol y cuántos casos lleva cada persona.
        </p>
      </section>

      {/* Resumen */}
      <MetricStrip
        size="md"
        metrics={[
          { key: "admins", label: "Administradores", value: admins.length, tone: "slate" },
          { key: "investigators", label: "Investigadores", value: regularMembers.length, tone: "signal" },
          { key: "viewers", label: "Observadores", value: viewers.length, tone: "haze" },
          { key: "departments", label: "Departamentos", value: departments.length, tone: "amber" },
        ]}
      />

      {/* Team Members Grid */}
      <div className="space-y-6">
        {/* Administrators */}
        {admins.length > 0 && (
          <div>
            <h2 className="mb-4 text-base font-semibold text-ev-night">Administradores</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {admins.map((member) => (
                <Card
                  key={member.userId}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardBody className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <User
                        name={member.userName}
                        description={member.email}
                        avatarProps={{
                          name: member.userName[0],
                          size: "lg",
                        }}
                      />
                      <Chip color="primary" size="sm" variant="flat">
                        Admin
                      </Chip>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm text-slate-500">
                        Acceso a todos los departamentos
                      </p>

                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500">
                          Denuncias asignadas
                        </span>
                        <span className="font-semibold">
                          {member.assignedReports}
                        </span>
                      </div>

                      <Button
                        as={Link}
                        href={`/app/team/${member.userId}`}
                        variant="flat"
                        color="primary"
                        size="sm"
                        className="w-full mt-4"
                      >
                        Ver ficha
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Regular Members */}
        {regularMembers.length > 0 && (
          <div>
            <h2 className="mb-4 text-base font-semibold text-ev-night">Investigadores</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {regularMembers.map((member) => (
                <Card
                  key={member.userId}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardBody className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <User
                        name={member.userName}
                        description={member.email}
                        avatarProps={{
                          name: member.userName[0],
                          size: "lg",
                        }}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">
                          Departamento
                        </span>
                        <Chip size="sm" variant="flat">
                          {member.departmentName}
                        </Chip>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500">
                          Casos Asignados
                        </span>
                        <span className="font-semibold">
                          {member.assignedReports}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500">
                          Completados
                        </span>
                        <span className="font-semibold text-green-600">
                          {member.completedReports}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500">
                          En Progreso
                        </span>
                        <span className="font-semibold text-sky-700">
                          {member.inProgressReports}
                        </span>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-slate-500">
                            Rendimiento
                          </span>
                          <span className="text-sm font-bold">
                            {member.performanceScore}%
                          </span>
                        </div>
                        <Progress
                          value={member.performanceScore}
                          color={
                            member.performanceScore > 80
                              ? "success"
                              : member.performanceScore >= 50
                              ? "warning"
                              : "danger"
                          }
                          size="sm"
                        />
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="flat"
                          size="sm"
                          onPress={() => handleAssignDepartment(member)}
                          className="flex-1"
                        >
                          Cambiar Depto
                        </Button>
                        <Button
                          as={Link}
                          href={`/app/team/${member.userId}`}
                          variant="flat"
                          color="primary"
                          size="sm"
                          className="flex-1"
                        >
                          Ver ficha
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Viewers (read-only oversight) */}
        {viewers.length > 0 && (
          <div>
            <h2 className="mb-4 text-base font-semibold text-ev-night">Observadores</h2>
            <p className="text-sm text-slate-500 -mt-2 mb-4">
              Acceso de solo lectura a todos los casos — sin permisos de edición
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {viewers.map((member) => (
                <Card
                  key={member.userId}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardBody className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <User
                        name={member.userName}
                        description={member.email}
                        avatarProps={{
                          name: member.userName[0],
                          size: "lg",
                        }}
                      />
                      <Chip color="default" size="sm" variant="flat">
                        Solo lectura
                      </Chip>
                    </div>
                    <Button
                      as={Link}
                      href={`/app/team/${member.userId}`}
                      variant="flat"
                      color="primary"
                      size="sm"
                      className="w-full"
                    >
                      Ver ficha
                    </Button>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedMember && (
        <AssignDepartmentModal
          isOpen={assignModal.isOpen}
          onClose={assignModal.onClose}
          member={{
            userId: selectedMember.userId,
            userName: selectedMember.userName,
            userEmail: selectedMember.email,
            currentDepartment: selectedMember.departmentId,
          }}
          departments={departments}
          onSuccess={() => {
            assignModal.onClose();
            refreshData();
          }}
        />
      )}
    </div>
  );
}
