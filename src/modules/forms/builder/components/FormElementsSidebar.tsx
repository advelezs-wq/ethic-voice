import React from "react";
import { SidebarBtnElement } from "./SidebarBtnElement";
import { FormElements } from "./FormElements";
import { Divider } from "@heroui/react";

export const FormElementsSidebar = () => {
  return (
    <div>
      <p className="text-sm text-gray-500">Arrastrar y soltar elementos</p>
      <Divider className="my-2 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 place-items-center">
        <p className="text-sm text-gray-600 col-span-1 md:col-span-2 my-2 place-self-start">
          Layout elements
        </p>
        <SidebarBtnElement formElement={FormElements.TitleField} />
        <SidebarBtnElement formElement={FormElements.SubTitleField} />
        <SidebarBtnElement formElement={FormElements.ParagraphField} />
        <SidebarBtnElement formElement={FormElements.SeparatorField} />
        <SidebarBtnElement formElement={FormElements.SpacerField} />
        <p className="text-sm text-gray-600 col-span-1 md:col-span-2 my-2 place-self-start">
          Form elements
        </p>
        <SidebarBtnElement formElement={FormElements.TextField} />
        <SidebarBtnElement formElement={FormElements.NumberField} />
        <SidebarBtnElement formElement={FormElements.TextAreaField} />
        <SidebarBtnElement formElement={FormElements.DateField} />
        <SidebarBtnElement formElement={FormElements.SelectField} />
      </div>
    </div>
  );
};
