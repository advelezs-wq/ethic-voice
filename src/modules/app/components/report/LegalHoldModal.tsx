"use client";

import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Textarea,
} from "@heroui/react";
import { setLegalHold } from "@/actions/reports.actions";
import { useSafeToast } from "../../hooks/useSafeToast";

interface LegalHoldModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: number;
  currentlyOnHold: boolean;
  onSuccess?: () => void;
}

export function LegalHoldModal({
  isOpen,
  onClose,
  reportId,
  currentlyOnHold,
  onSuccess,
}: LegalHoldModalProps) {
  const { showSuccess, showError } = useSafeToast();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setReason("");
    onClose();
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await setLegalHold(reportId, !currentlyOnHold, reason);
      showSuccess(
        currentlyOnHold
          ? "Legal hold retirado — el caso vuelve a seguir la política de retención normal"
          : "Legal hold activado — este caso no se eliminará automáticamente"
      );
      onSuccess?.();
      handleClose();
    } catch (e) {
      showError(e instanceof Error ? e.message : "No se pudo actualizar el legal hold");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalContent>
        {(onModalClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <h3 className="text-lg font-semibold">
                {currentlyOnHold ? "Retirar Legal Hold" : "Activar Legal Hold"}
              </h3>
              <p className="text-sm text-slate-500 font-normal">
                {currentlyOnHold
                  ? "El caso volverá a seguir la política de retención automática de la organización."
                  : "Mientras esté activo, este caso nunca se eliminará automáticamente por política de retención, sin importar la fecha configurada."}
              </p>
            </ModalHeader>
            <ModalBody>
              {!currentlyOnHold && (
                <Textarea
                  label="Motivo *"
                  placeholder="Ej. litigio en curso, requerimiento regulatorio, investigación externa activa..."
                  value={reason}
                  onValueChange={setReason}
                  minRows={3}
                  isRequired
                />
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onModalClose}>
                Cancelar
              </Button>
              <Button
                color={currentlyOnHold ? "warning" : "danger"}
                onPress={handleConfirm}
                isLoading={isSubmitting}
                isDisabled={!currentlyOnHold && !reason.trim()}
              >
                {currentlyOnHold ? "Retirar Legal Hold" : "Activar Legal Hold"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
