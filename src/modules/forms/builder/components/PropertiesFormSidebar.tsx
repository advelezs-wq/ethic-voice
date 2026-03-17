import React from "react";
import { useDesigner } from "../hooks/useDesigner";
import { FormElements } from "./FormElements";
import { Button } from "@heroui/react";

export const PropertiesFormSidebar = () => {
  const { selectedElement, setSelectedElement } = useDesigner();

  if (!selectedElement) return null;

  const PropertiesForm =
    FormElements[selectedElement?.type].propertiesComponent;

  return (
    <div className="flex flex-col p-2">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">Element properties</p>
        <Button
          isIconOnly
          variant="light"
          onPress={() => {
            setSelectedElement(null);
          }}
        >
          <i
            className="icon-[material-symbols--close] "
            role="img"
            aria-hidden="true"
          />
        </Button>
      </div>
      <PropertiesForm elementInstance={selectedElement} />
    </div>
  );
};
