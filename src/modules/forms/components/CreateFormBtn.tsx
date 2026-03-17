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
        title: "Success",
      });

      router.push(`/app/your-forms/builder/${formId}`);
    } catch {
      addToast({
        title: "Error",
        description: "Something went wrong, please try again later",
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
            className="icon-[bi--file-earmark-plus-fill] size-8 text-gray-700 group-hover:text-primary"
            role="img"
            aria-hidden="true"
          />
        }
      >
        <p className="font-bold text-xl text-gray-700 group-hover:text-primary">
          Create new form
        </p>
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader className="flex-col items-start">
            <h2>Create form</h2>
            <p>Create a new form to start collecting responses</p>
          </ModalHeader>
          <ModalBody>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-2 w-full"
              >
                <Controller
                  control={form.control}
                  name="name"
                  render={({ field, fieldState: { error } }) => (
                    <Input
                      label="Name"
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
                      label="Description"
                      {...field}
                      errorMessage={error?.message}
                      isInvalid={error ? true : false}
                    />
                  )}
                />
              </form>
            </Form>
          </ModalBody>
          <ModalFooter className="mt-0">
            <Button
              onClick={form.handleSubmit(onSubmit)}
              isLoading={form.formState.isSubmitting}
              className="w-full"
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
