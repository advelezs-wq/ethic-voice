"use client";

import {
  addToast,
  Button,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Textarea,
  useDisclosure,
} from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { formSchema, formSchemaType } from "../lib/schemas/form";
import { CreateForm } from "@/actions/form";
import { useRouter } from "next/navigation";

export const CreateFormBtn = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const router = useRouter();

  const form = useForm<formSchemaType>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: formSchemaType) => {
    try {
      const formId = await CreateForm(values);

      addToast({
        title: "Formulario creado",
      });

      router.push(`/app/your-forms/builder/${formId}`);
    } catch {
      addToast({
        title: "Error",
        description: "Algo salió mal, intenta de nuevo más tarde",
        color: "danger",
      });
    }
  };

  return (
    <>
      <Button
        variant="bordered"
        onPress={onOpen}
        className="group border-primary/20 h-[190px] items-center justify-center flex flex-col hover:border-primary hover:cursor-pointer border-dashed gap-4"
        startContent={
          <i
            className="icon-[bi--file-earmark-plus-fill] size-8 text-slate-600 group-hover:text-primary"
            role="img"
            aria-hidden="true"
          />
        }
      >
        <p className="font-bold text-xl text-slate-600 group-hover:text-primary">
          Crear formulario
        </p>
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader className="flex-col items-start">
            <h2>Crear formulario</h2>
            <p>Crea un nuevo formulario para empezar a recibir denuncias</p>
          </ModalHeader>
          <ModalBody>
            <Form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-2 w-full"
            >
              <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState: { error } }) => (
                  <Input
                    label="Nombre"
                    {...field}
                    errorMessage={error?.message}
                    isInvalid={error ? true : false}
                  />
                )}
              />
              <Controller
                control={form.control}
                name="description"
                render={({ field, fieldState: { error } }) => (
                  <Textarea
                    label="Descripción"
                    {...field}
                    errorMessage={error?.message}
                    isInvalid={error ? true : false}
                  />
                )}
              />
            </Form>
          </ModalBody>
          <ModalFooter className="mt-0">
            <Button
              onClick={form.handleSubmit(onSubmit)}
              isLoading={form.formState.isSubmitting}
              className="w-full"
            >
              Guardar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
