"use client";

import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Tabs, Tab } from "@heroui/tabs";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Chip } from "@heroui/chip";
import { Avatar } from "@heroui/avatar";
import { Spinner } from "@heroui/spinner";
import { useDisclosure } from "@heroui/use-disclosure";
import { addToast } from "@/modules/core/utils/safe-toast";
import { usePlanPermissions } from "@/modules/core/hooks/usePlanPermissions";
import { useUser } from "@clerk/nextjs";
import { useOrganization as useOrgStore } from "@/modules/app/hooks/useOrganization";
import { OrganizationMember } from "@/types/auth.types";
import { isSuperAdmin } from "@/modules/core/utils/permissions";
import { EnhancedInviteMemberModal } from "./EnhancedInviteMemberModal";
import { OrganizationLogoDropzone } from "./OrganizationLogoDropzone";
import { useUserRole } from "@/modules/core/hooks/useUserRole";

interface CustomOrganizationManagementProps {
  className?: string;
}

export function CustomOrganizationManagement({
  className,
}: CustomOrganizationManagementProps) {
  const { currentOrganization } = useOrgStore();
  const { user } = useUser();
  const { permissions: rolePermissions } = useUserRole();
  const {
    planInfo,
    permissions: _planPermissions,
    isLoading: planLoading,
  } = usePlanPermissions();

  // State
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

  // Modals
  const {
    isOpen: isInviteOpen,
    onOpen: onInviteOpen,
    onClose: onInviteClose,
  } = useDisclosure();
  const {
    isOpen: isOrgSettingsOpen,
    onOpen: onOrgSettingsOpen,
    onClose: onOrgSettingsClose,
  } = useDisclosure();

  // Organization settings form
  const [orgForm, setOrgForm] = useState({
    name: currentOrganization?.name || "",
    logoUrl: currentOrganization?.logoUrl || "",
  });

  // Load members on component mount
  useEffect(() => {
    if (currentOrganization?.id) {
      loadMembers();
      setOrgForm({
        name: currentOrganization.name || "",
        logoUrl: currentOrganization.logoUrl || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrganization?.id]);

  const loadMembers = async () => {
    if (!currentOrganization?.id) return;

    try {
      setMembersLoading(true);
      const response = await fetch(
        `/api/organization/${currentOrganization.id}/members`
      );

      if (!response.ok) {
        throw new Error("Failed to load members");
      }

      const data = await response.json();

      // Filter out super admin from visible members
      const filteredMembers = data.members.filter(
        (member: OrganizationMember) => {
          return !isSuperAdmin(member.user.email);
        }
      );

      setMembers(filteredMembers);
    } catch (error) {
      console.error("Error loading members:", error);
      addToast({
        title: "Error al cargar miembros",
        description: "No se pudieron cargar los miembros de la organización",
        color: "danger",
      });
    } finally {
      setMembersLoading(false);
    }
  };

  const handleInviteSuccess = () => {
    // Reload members after successful invitation
    setTimeout(() => loadMembers(), 1000);
  };

  const handleLogoUpdated = (logoUrl: string) => {
    setOrgForm((prev) => ({ ...prev, logoUrl }));
    // Refresh to show the new logo
    setTimeout(() => window.location.reload(), 500);
  };

  const handleLogoRemoved = () => {
    setOrgForm((prev) => ({ ...prev, logoUrl: "" }));
    // Refresh to remove the logo
    setTimeout(() => window.location.reload(), 500);
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!currentOrganization?.id) return;

    if (
      !confirm(
        `¿Estás seguro de que quieres remover a ${memberEmail} de la organización?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/organization/${currentOrganization.id}/remove-member`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ memberId }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove member");
      }

      addToast({
        title: "Miembro removido",
        description: `${memberEmail} ha sido removido de la organización`,
        color: "success",
      });
      loadMembers();
    } catch (error) {
      console.error("Error removing member:", error);
      addToast({
        title: "Error al remover miembro",
        description: "No se pudo remover al miembro de la organización",
        color: "danger",
      });
    }
  };

  const handleUpdateOrganization = async () => {
    if (!currentOrganization?.id) return;

    try {
      const response = await fetch(
        `/api/organization/${currentOrganization.id}/update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: orgForm.name.trim(),
            logoUrl: orgForm.logoUrl.trim() || null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update organization");
      }

      addToast({
        title: "Organización actualizada",
        description:
          "La información de la organización ha sido actualizada correctamente",
        color: "success",
      });
      onOrgSettingsClose();

      // Refresh the page to reflect changes
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error("Error updating organization:", error);
      addToast({
        title: "Error al actualizar organización",
        description: "No se pudo actualizar la información de la organización",
        color: "danger",
      });
    }
  };

  if (planLoading || !currentOrganization) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="overflow-x-auto pb-1 -mb-px">
        <Tabs aria-label="Gestión de organización" className="w-full min-w-max">
          <Tab key="members" title="Miembros">
            <div className="space-y-4 sm:space-y-6">
              {/* Plan Limits Info */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center w-full gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-semibold">
                      Límites del Plan
                    </h3>
                    <Chip color="primary" variant="flat">
                      {planInfo?.planType || "STARTER"}
                    </Chip>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-xl sm:text-2xl font-bold text-primary">
                        {members.filter((m) => m.role === "ADMIN").length} /{" "}
                        {planInfo?.maxUsers ?? 1}
                      </p>
                      <p className="text-sm text-gray-600">Administradores</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl sm:text-2xl font-bold text-primary">
                        {members.filter((m) => m.role === "MEMBER").length} /{" "}
                        {planInfo?.maxInvestigators === -1
                          ? "∞"
                          : (planInfo?.maxInvestigators ?? 5)}
                      </p>
                      <p className="text-sm text-gray-600">Investigadores</p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Members List */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center w-full gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-semibold">
                      Miembros del Equipo
                    </h3>
                    {rolePermissions.canInviteMembers && (
                      <Button
                        color="primary"
                        onPress={onInviteOpen}
                        startContent={
                          <i className="icon-[lucide--user-plus] size-4" />
                        }
                      >
                        Invitar Miembro
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardBody className="p-4 sm:p-6">
                  {membersLoading ? (
                    <div className="flex justify-center py-8">
                      <Spinner color="primary" />
                    </div>
                  ) : members.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No hay miembros en la organización
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 border rounded-lg gap-2 flex-wrap"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar
                              name={`${member.user.firstName} ${member.user.lastName}`}
                              size="sm"
                            />
                            <div>
                              <p className="font-medium">
                                {member.user.firstName} {member.user.lastName}
                              </p>
                              <p className="text-sm text-gray-600">
                                {member.user.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Chip
                              color={
                                member.role === "ADMIN" ? "primary" : "default"
                              }
                              size="sm"
                              variant="flat"
                            >
                              {member.role === "ADMIN"
                                ? "Admin"
                                : "Investigador"}
                            </Chip>
                            {member.isBlocked && (
                              <Chip
                                color="danger"
                                size="sm"
                                variant="flat"
                                startContent={
                                  <i className="icon-[lucide--shield-x] size-3" />
                                }
                              >
                                Bloqueado
                              </Chip>
                            )}
                            {rolePermissions.canInviteMembers &&
                              member.user.email !==
                                user?.primaryEmailAddress?.emailAddress && (
                                <Button
                                  size="sm"
                                  color="danger"
                                  variant="light"
                                  onPress={() =>
                                    handleRemoveMember(
                                      member.id,
                                      member.user.email
                                    )
                                  }
                                >
                                  <i className="icon-[lucide--user-minus] size-4" />
                                </Button>
                              )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          </Tab>

          {rolePermissions.canManageOrganization && (
            <Tab key="settings" title="Configuración">
              <Card>
                <CardHeader>
                  <h3 className="text-base sm:text-lg font-semibold">
                    Configuración de la Organización
                  </h3>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar
                        name={currentOrganization.name}
                        size="lg"
                      />
                      <div>
                        <h4 className="text-lg sm:text-xl font-semibold">
                          {currentOrganization.name}
                        </h4>
                        <p className="text-gray-600">
                          {currentOrganization.slug}
                        </p>
                      </div>
                    </div>
                    <Button
                      color="primary"
                      variant="flat"
                      onPress={onOrgSettingsOpen}
                      startContent={
                        <i className="icon-[lucide--settings] size-4" />
                      }
                    >
                      Editar Organización
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </Tab>
          )}
        </Tabs>
      </div>

      {/* Enhanced Invite Member Modal */}
      <EnhancedInviteMemberModal
        isOpen={isInviteOpen}
        onClose={onInviteClose}
        onSuccess={handleInviteSuccess}
        currentMembersCount={members.filter((m) => m.role === "MEMBER").length}
        currentAdminsCount={members.filter((m) => m.role === "ADMIN").length}
        maxUsers={planInfo?.maxUsers || 1}
        maxInvestigators={planInfo?.maxInvestigators ?? 4}
        planType={planInfo?.planType || "STARTER"}
      />

      {/* Organization Settings Modal */}
      <Modal
        isOpen={isOrgSettingsOpen}
        onClose={onOrgSettingsClose}
        size="3xl"
        placement="center"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">
              Configuración de la Organización
            </h2>
            <p className="text-sm text-gray-600 font-normal">
              Actualiza la información y logo de tu organización
            </p>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              <div>
                <Input
                  label="Nombre de la Organización"
                  value={orgForm.name}
                  onChange={(e) =>
                    setOrgForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Nombre de la empresa"
                  startContent={
                    <i className="icon-[lucide--building-2] size-4 text-gray-400" />
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Logo de la Organización
                </label>
                <OrganizationLogoDropzone
                  organizationId={currentOrganization?.id || ""}
                  currentLogo={currentOrganization?.logoUrl || ""}
                  onLogoUpdated={handleLogoUpdated}
                  onLogoRemoved={handleLogoRemoved}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onOrgSettingsClose}>
              Cancelar
            </Button>
            <Button
              color="primary"
              onPress={handleUpdateOrganization}
              isDisabled={!orgForm.name.trim()}
            >
              Guardar Cambios
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
