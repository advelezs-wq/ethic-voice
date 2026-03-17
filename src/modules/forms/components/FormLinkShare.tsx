"use client";

import { Button, Input } from "@heroui/react";
import { addToast } from "@/modules/core/utils/safe-toast";
import React, { useEffect, useState } from "react";

export const FormLinkShare = ({ shareUrl }: { shareUrl: string }) => {
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const shareLink = `${window.location.origin}/submit/${shareUrl}`;

  return (
    <div className="flex flex-grow gap-4 items-center">
      <Input value={shareLink} readOnly />
      <Button
        className="min-w-[200px]"
        onPress={() => {
          navigator.clipboard.writeText(shareLink);
          addToast({
            title: "Copiado!",
            description: "Link copiado al clipboard",
          });
        }}
        startContent={
          <i
            className="icon-[material-symbols--share] size-4"
            role="img"
            aria-hidden="true"
          />
        }
      >
        Share link
      </Button>
    </div>
  );
};
