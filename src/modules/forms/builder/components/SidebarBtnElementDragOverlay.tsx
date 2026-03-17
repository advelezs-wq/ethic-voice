import React from "react";
import { FormElement } from "./FormElements";
import { Button } from "@heroui/react";

export const SidebarBtnElementDragOverlay = ({
  formElement,
}: {
  formElement: FormElement;
}) => {
  const { label, icon } = formElement.designerBtnElement;

  return (
    <Button
      variant="bordered"
      className="flex flex-col gap-2 cursor-grab size-[120px]"
      startContent={icon}
    >
      <p className="text-xs">{label}</p>
    </Button>
  );
};
