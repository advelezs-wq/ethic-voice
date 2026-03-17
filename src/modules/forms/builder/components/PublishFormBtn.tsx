import { PublishForm } from "@/actions/form";
import {
  // addToast, // Now using safe-toast
  Button,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { addToast } from "@/modules/core/utils/safe-toast";

export const PublishFormBtn = ({ id }: { id: number }) => {
  const { onOpen, isOpen, onOpenChange } = useDisclosure();
  const [loading, startTransition] = useTransition();
  const router = useRouter();

  const publishForm = async () => {
    try {
      await PublishForm(id);
      addToast({
        title: "Success",
        description: "Este formulario es ahora publico",
      });
      router.refresh();
    } catch {
      addToast({
        title: "Error",
        description: "Something went wrong",
      });
    }
  };

  return (
    <>
      <Button
        onPress={onOpen}
        className="text-white bg-gradient-to-r from-indigo-400 to-cyan-500"
        startContent={
          <i
            className="icon-[ix--publish] size-6"
            role="img"
            aria-hidden="true"
          />
        }
      >
        Publish
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader className="flex-col">
            <h2>Estás seguro?</h2>
            <p>
              Esta acción no puede ser revertida. Después de publicar no podrás
              editar este formulario. <br />
              <br />
              <span className="font-medium">
                Publicando este formulario lo harás publico y podrás obtener las
                denuncias mediante este formulario.
              </span>
            </p>
          </ModalHeader>
          <ModalFooter>
            <Button color="danger">Cancelar</Button>
            <Button
              isLoading={loading}
              onPress={() => {
                startTransition(publishForm);
              }}
            >
              Publicar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
