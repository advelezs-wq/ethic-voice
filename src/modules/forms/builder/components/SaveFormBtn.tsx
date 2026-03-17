import { Button } from "@heroui/react";
import { addToast } from "@/modules/core/utils/safe-toast";
import React, { useTransition } from "react";
import { useDesigner } from "../hooks/useDesigner";
import { UpdateFormContent } from "@/actions/form";

export const SaveFormBtn = ({ id }: { id: number }) => {
  const { elements } = useDesigner();
  const [loading, startTransition] = useTransition();

  const updateFormContent = async () => {
    try {
      const jsonElements = JSON.stringify(elements);
      await UpdateFormContent(id, jsonElements);
      addToast({
        title: "Success",
        description: "Your form has been saved!",
      });
    } catch {
      addToast({
        title: "Error",
        description: "Something wet wrong",
      });
    }
  };

  return (
    <Button
      variant="bordered"
      disabled={loading}
      onPress={() => {
        startTransition(updateFormContent);
      }}
      startContent={
        <i
          className="icon-[lucide--save] size-6"
          role="img"
          aria-hidden="true"
        />
      }
      isLoading={loading}
    >
      Save
    </Button>
  );
};
