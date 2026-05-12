export const sectionNavItems = [
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#solucion", label: "Solución" },
  { href: "#seguridad", label: "Seguridad" },
  { href: "#planes", label: "Planes" },
  { href: "#faq", label: "Preguntas" },
] as const;

/** Enlace principal a Blog (también en el menú “Más” no se duplica) */
export const blogNavItem = { href: "/blog", label: "Blog" } as const;

export const productLinks = [
  { href: "/platform", label: "Plataforma" },
  { href: "/services", label: "Servicios" },
  { href: "/pricing", label: "Precios" },
] as const;

export const companyLinks = [
  { href: "/about", label: "Empresa" },
  { href: "/privacidad", label: "Privacidad" },
] as const;
