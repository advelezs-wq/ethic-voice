"use client";

import { Form } from "@prisma/client";
import React, { useEffect, useState } from "react";
import { PreviewModalBtn } from "./PreviewModalBtn";
import { SaveFormBtn } from "./SaveFormBtn";
import { PublishFormBtn } from "./PublishFormBtn";
import { Designer } from "./Designer";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { DragOverlayWrapper } from "./DragOverlayWrapper";
import { useDesigner } from "../hooks/useDesigner";
import { Button, Input, Spinner } from "@heroui/react";
import { addToast } from "@/modules/core/utils/safe-toast";
import Link from "next/link";
import Confetti from "react-confetti";

export const FormBuilder = ({ form }: { form: Form }) => {
  const { setElements } = useDesigner();
  const [isReady, setIsReady] = useState<boolean>(false);

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10,
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 300,
      tolerance: 5,
    },
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  useEffect(() => {
    if (isReady) return;
    const elements = JSON.parse(form.content);
    setElements(elements);
    setIsReady(true);
  }, [form, setElements, isReady]);

  if (!isReady) {
    <div className="flex flex-col items-center justify-center w-full h-full">
      <Spinner />
    </div>;
  }

  const shareUrl = `${window.location.origin}/submit/${form.shareURL}`;

  if (form.isPublished) {
    return (
      <>
        <Confetti
          recycle={false}
          width={window.innerWidth}
          height={window.innerHeight}
        />
        <div className="flex flex-col items-center justify-center h-full w-full">
          <div className="max-w-md">
            <h1 className="text-center text-4xl font-bold border-b pb-2 mb-10">
              🎊🎊 Form published 🎊🎊
            </h1>
            <h2 className="text-2xl">Share this form</h2>
            <h3 className="text-xl text-gray-500 border-b pb-10">
              Anyone with the link can view and submit the from
            </h3>
            <div className="my-4 flex flex-col gap-2 items-center w-full border-b pb-4">
              <Input className="w-full" readOnly value={shareUrl} />
              <Button
                className="mt-2 w-full bg-black text-white"
                onPress={() => {
                  navigator.clipboard.writeText(shareUrl);
                  addToast({
                    title: "Copied!",
                    description: "Link copied to clipboard",
                  });
                }}
              >
                Copy link
              </Button>
            </div>
            <div className="flex w-full justify-between">
              <Button
                variant="light"
                as={Link}
                href="/app"
                startContent={
                  <i
                    className="icon-[mdi--arrow-left]"
                    role="img"
                    aria-hidden="true"
                  />
                }
              >
                Go back home
              </Button>
              <Button
                variant="light"
                as={Link}
                href={`/app/your-forms/forms/${form.id}`}
                endContent={
                  <i
                    className="icon-[mdi--arrow-right]"
                    role="img"
                    aria-hidden="true"
                  />
                }
              >
                Form details
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <DndContext sensors={sensors}>
      <section className="flex flex-col w-full h-full">
        <nav className="flex justify-between border-b-2 p-4 gap-3 items-center">
          <h2 className="truncate font-medium">
            <span className="text-gray-700 mr-2">Form:</span>
            {form.title}
          </h2>
          <div className="flex items-center gap-2">
            <PreviewModalBtn />
            {!form.isPublished && (
              <>
                <SaveFormBtn id={form.id} />
                <PublishFormBtn id={form.id} />
              </>
            )}
          </div>
        </nav>
        <div className="bg-dots flex w-full flex-grow items-center justify-center relative overflow-y-auto h-[200px]">
          <Designer />
        </div>
      </section>
      <DragOverlayWrapper />
    </DndContext>
  );
};
