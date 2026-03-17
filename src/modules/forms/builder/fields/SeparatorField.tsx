"use client";

import { Divider } from "@heroui/react";
import { ElementsType, FormElement } from "../components/FormElements";

const type: ElementsType = "SeparatorField";

export const SeparatorFieldFormElement: FormElement = {
  type,
  construct: (id: string) => ({
    id,
    type,
  }),
  designerBtnElement: {
    icon: (
      <i
        className="icon-[ri--separator] size-8 text-black"
        role="img"
        aria-hidden="true"
      />
    ),
    label: "Campo de espaciado",
  },
  designerComponent: DesignerComponent,
  formComponent: FormComponent,
  propertiesComponent: PropertiesComponent,
  validate: (): boolean => true,
};

function DesignerComponent() {
  return (
    <div className="flex flex-col gap-2 w-full">
      <p>Campo de espaciado</p>
      <Divider />
    </div>
  );
}
function FormComponent() {
  return <Divider />;
}

function PropertiesComponent() {
  return <p>No hay propiedades para este elemento</p>;
}
