"use client";

import { useEffect } from "react";
import { Sidebar } from "../Sidebar";
import { usePathname } from "next/navigation";

export const BurgerMenuContent = ({
  isOpen,
  closeMenu,
}: {
  isOpen: boolean;
  closeMenu: () => void;
}) => {
  const pathname = usePathname();

  // Close menu when screen size becomes larger than 1024px
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isOpen) {
        closeMenu();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, closeMenu]);

  useEffect(() => {
    closeMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div
      className={`fixed top-0 left-0 h-screen z-40 bg-ev-night transition-transform duration-300 ease-ev-out transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } lg:hidden`}
      aria-hidden={!isOpen}
    >
      <div className="flex justify-end p-4">
        <button onClick={closeMenu} className="p-2 text-white/70 hover:text-white" aria-label="Cerrar menú">
          <i
            className="icon-[heroicons-solid--x] size-6"
            role="img"
            aria-hidden="true"
          />
        </button>
      </div>
      <Sidebar />
    </div>
  );
};
