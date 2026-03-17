"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Spinner,
} from "@heroui/react";
import { SignOutButton } from "@clerk/nextjs";
import { useOrganization } from "@/modules/app/hooks/useOrganization";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface CreateOrganizationModalProps {
  isOpen: boolean;
  onOrganizationCreated?: (organization?: any) => void;
}

export function CreateOrganizationModal({
  isOpen,
  onOrganizationCreated,
}: CreateOrganizationModalProps) {
  const pathname = usePathname();

  const { currentOrganization } = useOrganization();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);

  if (currentOrganization) {
    return <></>;
  }

  return (
    <Modal
      isOpen={isOpen}
      isDismissable={false}
      isKeyboardDismissDisabled={true}
      hideCloseButton={true}
      size="lg"
      placement="center"
      backdrop="blur"
      classNames={{
        base: "z-50",
        backdrop: "z-40",
        wrapper: "z-50",
      }}
    >
      <ModalContent className="max-w-2xl mx-auto">
        <ModalHeader className="flex flex-col gap-1 text-center border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            Bienvenido a Ethics Line
          </h2>
          <p className="text-sm text-gray-600">
            Crea tu organización para comenzar
          </p>
        </ModalHeader>
        <ModalBody className="p-6">
          <div className="w-full flex justify-center">
            <div className="w-full max-w-md space-y-3">
              <Input label="Nombre de la organización" value={name} onChange={(e) => setName(e.target.value)} />
              <Input label="Slug (opcional)" value={slug} onChange={(e) => setSlug(e.target.value)} />
              <Button color="primary" isLoading={loading} onPress={async () => {
                setLoading(true);
                try {
                  const res = await fetch("/api/organizations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, slug }) });
                  if (res.ok) {
                    onOrganizationCreated?.();
                    window.location.href = pathname;
                  }
                } finally {
                  setLoading(false);
                }
              }}>Crear organización</Button>
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="justify-center border-t">
          <SignOutButton redirectUrl="/auth/sign-in">
            <Button variant="flat" color="danger" size="sm">
              <i className="icon-[lucide--log-out] size-4 mr-2" />
              Cerrar Sesión
            </Button>
          </SignOutButton>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
