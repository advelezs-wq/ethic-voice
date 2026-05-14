"use client";

import React, { useEffect } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";

type RiskLevel = "low" | "medium" | "high";

interface ConfirmActionModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  isLoading?: boolean;
  riskLevel?: RiskLevel;
  onClose: () => void;
  onConfirm: () => void;
}

const riskStyles: Record<RiskLevel, { tag: string; confirmColor: "default" | "warning" | "danger" }> = {
  low: { tag: "Riesgo bajo", confirmColor: "default" },
  medium: { tag: "Riesgo medio", confirmColor: "warning" },
  high: { tag: "Riesgo alto", confirmColor: "danger" },
};

export function ConfirmActionModal({
  isOpen,
  title,
  description,
  confirmLabel,
  isLoading = false,
  riskLevel = "medium",
  onClose,
  onConfirm,
}: ConfirmActionModalProps) {
  const style = riskStyles[riskLevel];

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && !isLoading) {
        event.preventDefault();
        onConfirm();
        return;
      }

      if (event.key === "Escape" && !isLoading) {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, isLoading, onClose, onConfirm]);

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()} placement="center">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {title}
          <span className="text-xs font-medium text-default-500">{style.tag}</span>
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-default-700">{description}</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={isLoading}>
            Cancelar
          </Button>
          <Button color={style.confirmColor} onPress={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
