"use client";

import { Button } from "@heroui/button";

export function PrintPosterButton() {
  return (
    <Button
      color="primary"
      onPress={() => window.print()}
      startContent={<i className="icon-[lucide--printer] size-4" />}
      className="print:hidden"
    >
      Imprimir / Guardar como PDF
    </Button>
  );
}
