import React from "react";
import { useDesigner } from "../hooks/useDesigner";
import { FormElementsSidebar } from "./FormElementsSidebar";
import { PropertiesFormSidebar } from "./PropertiesFormSidebar";

export const DesignerSidebar = () => {
  const { selectedElement } = useDesigner();

  return (
    <aside className="w-[400px] max-w-[400px] flex flex-col flex-grow gap-2 border-l-1 border-gray-700 p-4 bg-white overflow-y-auto h-full">
      {!selectedElement && <FormElementsSidebar />}
      {selectedElement && <PropertiesFormSidebar />}
    </aside>
  );
};
