"use client";

import { UserProfile } from "@clerk/nextjs";
import React from "react";
import { Tabs, Tab } from "@heroui/tabs";
import { NotificationPreferences } from "@/modules/app/components/profile/NotificationPreferences";
import { PageHero } from "@/modules/app/components/ui";
import { ethicvoiceAuthAppearance } from "@/lib/ethicvoice-clerk-appearance";

const Profile = () => {
  return (
    <div className="space-y-6">
      <PageHero
        kicker="Cuenta"
        title="Mi perfil"
        description="Tus datos de acceso y los avisos que quieres recibir por correo."
      />

      <Tabs aria-label="Opciones del perfil" className="w-full">
        <Tab key="profile" title="Datos y seguridad">
          <div className="mt-6">
            <UserProfile routing="hash" appearance={ethicvoiceAuthAppearance} />
          </div>
        </Tab>

        <Tab key="notifications" title="Notificaciones">
          <div className="mt-6 max-h-[70vh] overflow-y-auto">
            <NotificationPreferences />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
};

export default Profile;
