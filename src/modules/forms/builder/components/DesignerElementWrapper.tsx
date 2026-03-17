import React, { useState } from "react";
import { FormElementInstance, FormElements } from "./FormElements";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Button, cn } from "@heroui/react";
import { useDesigner } from "../hooks/useDesigner";

export const DesignerElementWrapper = ({
  element,
}: {
  element: FormElementInstance;
}) => {
  const [isMouseOver, setIsMouseOver] = useState<boolean>(false);

  const { removeElement, setSelectedElement } = useDesigner();

  const topHalf = useDroppable({
    id: element.id + "-top",
    data: {
      type: element.type,
      elementId: element.id,
      isTopHalfDesignerElement: true,
    },
  });

  const bottomHalf = useDroppable({
    id: element.id + "-bottom",
    data: {
      type: element.type,
      elementId: element.id,
      isBottomHalfDesignerElement: true,
    },
  });

  const draggable = useDraggable({
    id: element.id + "-drag-handler",
    data: {
      type: element.type,
      elementId: element.id,
      isDesignerElement: true,
    },
  });

  if (draggable.isDragging) return null;

  const DesignerElement = FormElements[element.type].designerComponent;

  return (
    <div
      ref={draggable.setNodeRef}
      {...draggable.listeners}
      {...draggable.attributes}
      className="relative h-[120px] flex flex-col text-foreground"
      onMouseEnter={() => {
        setIsMouseOver(true);
      }}
      onMouseLeave={() => {
        setIsMouseOver(false);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedElement(element);
      }}
    >
      <div
        ref={topHalf.setNodeRef}
        className="absolute w-full h-1/2 rounded-t-md z-10"
      ></div>
      {isMouseOver && (
        <>
          <div className="z-10 absolute right-0 h-full">
            <Button
              className="flex justify-center h-full border rounded-md rounded-l-none bg-red-500"
              variant="bordered"
              onClick={(e) => {
                e.stopPropagation();
                removeElement(element.id);
              }}
            >
              <i
                className="icon-[tabler--trash] size-6"
                role="img"
                aria-hidden="true"
              />
            </Button>
          </div>
          <div className="absolute z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse">
            <p className="text-gray-600 text-sm">
              Click for properties or drag to move
            </p>
          </div>
        </>
      )}
      {topHalf.isOver && (
        <div className="absolute top-0 w-full rounded-md h-[7px] bg-black rounded-b-none"></div>
      )}
      <div
        className={cn(
          "flex w-full h-[120px] items-center rounded-md px-4 py-2 pointer-events-none bg-[#f4f4f5] opacity-100",
          isMouseOver && "opacity-30"
        )}
      >
        <DesignerElement elementInstance={element} />
      </div>
      <div
        ref={bottomHalf.setNodeRef}
        className="absolute w-full h-1/2 rounded-b-md bottom-0"
      ></div>
      {bottomHalf.isOver && (
        <div className="absolute bottom-0 w-full rounded-md h-[7px] bg-black rounded-t-none"></div>
      )}
    </div>
  );
};
