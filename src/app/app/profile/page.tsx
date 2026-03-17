"use client";

import { UserProfile } from "@clerk/nextjs";
import React from "react";
import { Tabs, Tab } from "@heroui/tabs";
import { NotificationPreferences } from "@/modules/app/components/profile/NotificationPreferences";

const Profile = () => {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-600 mt-1">
          Administra tu información personal y preferencias de notificaciones
        </p>
      </div>

      <Tabs aria-label="Opciones del perfil" className="w-full">
        <Tab key="profile" title="Ajustes del Perfil">
          <div className="mt-6 flex justify-center">
            <UserProfile />
          </div>
        </Tab>

        <Tab key="notifications" title="Preferencias de Notificaciones">
          <div className="mt-6 max-h-[70vh] overflow-y-auto">
            <NotificationPreferences />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
};

export default Profile;
