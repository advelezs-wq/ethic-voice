/** Ruta pública por defecto del PDF del ebook (archivo en `/public/ebook/`). */
export const DEFAULT_EBOOK_PDF_PATH = "/ebook/ebook_ethicvoice.pdf";

export function resolvePublicEbookPdfUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_EBOOK_PDF_URL?.trim();
  if (fromEnv) return fromEnv;
  return DEFAULT_EBOOK_PDF_PATH;
}
