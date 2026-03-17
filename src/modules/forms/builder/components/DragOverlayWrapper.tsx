import { Active, DragOverlay, useDndMonitor } from "@dnd-kit/core";
import React, { useState } from "react";
import { SidebarBtnElementDragOverlay } from "./SidebarBtnElementDragOverlay";
import { ElementsType, FormElements } from "./FormElements";
import { useDesigner } from "../hooks/useDesigner";

export const DragOverlayWrapper = () => {
  const [draggedItem, setDraggedItem] = useState<Active | null>(null);

  const { elements } = useDesigner();

  useDndMonitor({
    onDragStart: (event) => {
      setDraggedItem(event.active);
    },
    onDragCancel() {
      setDraggedItem(null);
    },
    onDragEnd() {
      setDraggedItem(null);
    },
  });

  if (!draggedItem) return null;

  let node = <div>No drag overlay</div>;
  const isSidebarBtnElement = draggedItem?.data.current?.isDesignerBtnElement;

  if (isSidebarBtnElement) {
    const type = draggedItem.data.current?.type as ElementsType;

    node = <SidebarBtnElementDragOverlay formElement={FormElements[type]} />;
  }

  const isDesignerElement = draggedItem.data?.current?.isDesignerElement;

  if (isDesignerElement) {
    const elementId = draggedItem.data.current?.elementId;
    const element = elements.find((el) => el.id === elementId);

    if (!element) node = <div>Element not found</div>;
    else {
      const DesignerElementComponent =
        FormElements[element.type].designerComponent;
      node = (
        <div className="flex w-full h-[120px] items-center rounded-md px-4 py-2 bg-[#f4f4f5] opacity-80 pointer-events-none">
          <DesignerElementComponent elementInstance={element} />
        </div>
      );
    }
  }

  return <DragOverlay>{node}</DragOverlay>;
};
