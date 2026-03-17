"use client";

import { Button } from "@heroui/react";
import { useEffect, useState } from "react";

export const VisitBtn = ({ shareUrl }: { shareUrl: string }) => {
  const [mounted, setMounted] = useState<boolean>();

  const shareLink = `${window.location.origin}/submit/${shareUrl}`;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Button
      className="w-[200px]"
      onPress={() => {
        window.open(shareLink, "_blank");
      }}
    >
      Visit
    </Button>
  );
};
