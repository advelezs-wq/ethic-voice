import React from "react";
import { FormElement } from "./FormElements";
import { Button, cn } from "@heroui/react";
import { useDraggable } from "@dnd-kit/core";

export const SidebarBtnElement = ({
  formElement,
}: {
  formElement: FormElement;
}) => {
  const { label, icon } = formElement.designerBtnElement;

  const draggable = useDraggable({
    id: `designer-btn-${formElement.type}`,
    data: {
      type: formElement.type,
      isDesignerBtnElement: true,
    },
  });

  return (
    <Button
      ref={draggable.setNodeRef}
      variant="bordered"
      className={cn(
        "flex flex-col gap-2 cursor-grab w-[120px] h-[120px] p-3 whitespace-normal",
        draggable.isDragging && "ring-2 ring-primary"
      )}
      {...draggable.listeners}
      {...draggable.attributes}
      startContent={icon}
    >
      <p>{label}</p>
    </Button>
  );
};
