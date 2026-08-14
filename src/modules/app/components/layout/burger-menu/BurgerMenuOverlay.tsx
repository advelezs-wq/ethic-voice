"use client";

import { useEffect } from "react";

export const BurgerMenuOverlay = ({
  isOpen,
  closeMenu,
}: {
  isOpen: boolean;
  closeMenu: () => void;
}) => {
  // Close menu when escape key is pressed
  useEffect(() => {
    const handleEscKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeMenu();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscKeyPress);
      // Prevent scrolling when menu is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscKeyPress);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, closeMenu]);

  return (
    <div
      className={`fixed inset-0 bg-black/50 lg:hidden transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      onClick={closeMenu}
      aria-hidden="true"
    />
  );
};
