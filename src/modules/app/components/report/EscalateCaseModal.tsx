"use client";

import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
} from "@heroui/react";
import { escalateReport } from "@/actions/report-assignments.actions";
import { useSafeToast } from "../../hooks/useSafeToast";

interface EscalateCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: number;
  onSuccess?: () => void;
}

export function EscalateCaseModal({
  isOpen,
  onClose,
  reportId,
  onSuccess,
}: EscalateCaseModalProps) {
  const { showSuccess, showError } = useSafeToast();
  const [escalatedToName, setEscalatedToName] = useState("");
  const [escalatedToEmail, setEscalatedToEmail] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setEscalatedToName("");
    setEscalatedToEmail("");
    setReason("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!escalatedToName.trim() || !reason.trim()) {
      showError("Indica a quién se escala el caso y el motivo");
      return;
    }
    setIsSubmitting(true);
    try {
      await escalateReport(reportId, {
        reason,
        escalatedToName,
        escalatedToEmail: escalatedToEmail || undefined,
      });
      showSuccess("Caso escalado exitosamente");
      onSuccess?.();
      handleClose();
    } catch (e) {
      showError(e instanceof Error ? e.message : "No se pudo escalar el caso");
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
              <h3 className="text-lg font-semibold">Escalar Caso</h3>
              <p className="text-sm text-slate-500 font-normal">
                Documenta a quién se escala este caso (ej. asesoría legal
                externa) — el caso se marcará como prioridad urgente
              </p>
            </ModalHeader>
            <ModalBody className="space-y-3">
              <Input
                label="Escalado a *"
                placeholder="Nombre de la persona o firma externa"
                value={escalatedToName}
                onValueChange={setEscalatedToName}
                isRequired
              />
              <Input
                label="Email de contacto (opcional)"
                type="email"
                placeholder="contacto@ejemplo.com"
                value={escalatedToEmail}
                onValueChange={setEscalatedToEmail}
              />
              <Textarea
                label="Motivo de la escalación *"
                placeholder="¿Por qué se escala este caso?"
                value={reason}
                onValueChange={setReason}
                minRows={3}
                isRequired
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onModalClose}>
                Cancelar
              </Button>
              <Button
                color="warning"
                onPress={handleSubmit}
                isLoading={isSubmitting}
              >
                Escalar Caso
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
