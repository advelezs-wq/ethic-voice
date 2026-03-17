/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@heroui/react";
import { Spinner } from "@heroui/spinner";
import { getAllOrganizationsStats } from "@/actions/superadmin.actions";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";
import { SystemStats } from "./SystemStats";
import { OrganizationCard } from "./OrganizationCard";

export function SuperAdminOrganizationsView() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await getAllOrganizationsStats();
      setOrganizations(data.organizations);
      setSystemStats(data.systemStats);
    } catch (error) {
      console.error("Error loading organizations:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Organizaciones
          </h1>
          <p className="text-gray-600">
            Administra todas las organizaciones del sistema
          </p>
        </div>
        <Button
          color="primary"
          onPress={() => setShowCreateModal(true)}
          startContent={<i className="icon-[tabler--building-plus] size-4" />}
        >
          Nueva Organización
        </Button>
      </div>

      {/* System Stats */}
      {systemStats && <SystemStats stats={systemStats} />}

      {/* Organizations Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Organizaciones ({organizations.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {organizations.map((org) => (
            <OrganizationCard key={org.id} organization={org} />
          ))}
        </div>
      </div>

      {/* Create Organization Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        size="lg"
      >
        <ModalContent>
          <ModalHeader>Crear Nueva Organización</ModalHeader>
          <ModalBody className="pb-6">
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget as HTMLFormElement;
                const formData = new FormData(form);
                const name = String(formData.get("name") || "");
                const slug = String(formData.get("slug") || "");
                const res = await fetch("/api/organizations", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name, slug }),
                });
                if (res.ok) {
                  setShowCreateModal(false);
                  await loadData();
                }
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input name="name" required className="mt-1 w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Slug (opcional)</label>
                <input name="slug" className="mt-1 w-full border rounded px-3 py-2" />
              </div>
              <div className="pt-2">
                <Button color="primary" type="submit">Crear</Button>
              </div>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
