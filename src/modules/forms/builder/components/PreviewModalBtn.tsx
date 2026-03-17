import { Button, Modal, ModalContent, useDisclosure } from "@heroui/react";
import React from "react";
import { useDesigner } from "../hooks/useDesigner";
import { FormElements } from "./FormElements";

export const PreviewModalBtn = () => {
  const { elements } = useDesigner();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <>
      <Button
        onPress={onOpen}
        variant="bordered"
        startContent={
          <i
            className="icon-[mage--preview] size-6"
            role="img"
            aria-hidden="true"
          />
        }
      >
        Preview
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent className="w-screen h-screen max-h-screen max-w-full flex flex-col flex-grow p-0 gap-0">
          <div className="px-4 py-2 border-b">
            <p className="text-lg font-bold text-gray-600">Form Preview</p>
            <p className="text-sm text-gray-600">
              This is how your form will look like to your users.
            </p>
          </div>
          <div className="bg-slate-50 flex flex-col flex-grow items-center justify-center p4 bg-dots overflow-y-auto">
            <div className="max-w-[620px] flex flex-col gap-4 flex-grow bg-background h-full w-full rounded-2xl p-8 overflow-y-auto">
              {elements.map((element) => {
                const FormComponent = FormElements[element.type].formComponent;

                return (
                  <FormComponent key={element.id} elementInstance={element} />
                );
              })}
            </div>
          </div>
        </ModalContent>
      </Modal>
    </>
  );
};
