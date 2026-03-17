"use client";

import { useState, useCallback } from "react";
import { BurgerMenuButton } from "./BurgerMenuButton";
import { BurgerMenuOverlay } from "./BurgerMenuOverlay";
import { BurgerMenuContent } from "./BurgerMenuContent";

export const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <>
      <BurgerMenuButton isOpen={isOpen} toggleMenu={toggleMenu} />
      <BurgerMenuOverlay isOpen={isOpen} closeMenu={closeMenu} />
      <BurgerMenuContent isOpen={isOpen} closeMenu={closeMenu} />
    </>
  );
};
