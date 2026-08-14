"use client";

import { UserProfile } from "@clerk/nextjs";
import React from "react";
import { Tabs, Tab } from "@heroui/tabs";
import { NotificationPreferences } from "@/modules/app/components/profile/NotificationPreferences";
import { PageHero } from "@/modules/app/components/ui";

const Profile = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHero
        kicker="Cuenta"
        title="Mi Perfil"
        description="Administra tu información personal y preferencias de notificaciones"
      />

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
