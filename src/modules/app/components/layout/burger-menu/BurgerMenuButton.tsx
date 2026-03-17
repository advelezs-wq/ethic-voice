"use client";

import { Button } from "@heroui/react";

export const BurgerMenuButton = ({
  isOpen,
  toggleMenu,
}: {
  isOpen: boolean;
  toggleMenu: () => void;
}) => {
  return (
    <Button
      variant="light"
      size="sm"
      aria-label={isOpen ? "Close menu" : "Open menu"}
      onPress={toggleMenu}
      className="lg:hidden px-0 m-0 min-w-max absolute top-4 left-4 md:left-8 z-10"
    >
      {isOpen ? (
        <i
          className="icon-[heroicons-solid--x] size-6"
          role="img"
          aria-hidden="true"
        />
      ) : (
        <i
          className="icon-[heroicons-solid--menu] size-6"
          role="img"
          aria-hidden="true"
        />
      )}
    </Button>
  );
};
