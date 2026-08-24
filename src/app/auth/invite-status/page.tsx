import Link from "next/link";

const MESSAGES: Record<string, { title: string; description: string }> = {
  expired: {
    title: "Esta invitación venció",
    description:
      "El enlace de invitación ya no es válido. Pídele a tu administrador que te reenvíe una invitación nueva desde EthicVoice (Organización → Invitaciones Pendientes → Reenviar).",
  },
  already_accepted: {
    title: "Esta invitación ya fue utilizada",
    description:
      "Ya aceptaste esta invitación anteriormente. Inicia sesión con la cuenta que usaste para aceptarla.",
  },
  revoked: {
    title: "Esta invitación fue cancelada",
    description:
      "Un administrador canceló esta invitación. Pídele que te envíe una nueva si sigues necesitando acceso.",
  },
  email_mismatch: {
    title: "Correo distinto al invitado",
    description:
      "Esta invitación fue enviada a otro correo. Inicia sesión con la cuenta que la recibió, o pide que te reenvíen la invitación al correo correcto.",
  },
  invalid: {
    title: "Invitación no válida",
    description:
      "No pudimos validar este enlace de invitación. Pídele a tu administrador que te envíe uno nuevo.",
  },
};

export default async function InviteStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const content = MESSAGES[reason || "invalid"] || MESSAGES.invalid;

  return (
    <div className="w-full max-w-md rounded-3xl border border-emerald-100/70 bg-white/70 p-8 text-center shadow-[0_20px_60px_-42px_rgba(5,26,36,0.6)] backdrop-blur">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
        <i className="icon-[lucide--mail-x] size-6 text-amber-600" aria-hidden />
      </div>
      <h1 className="text-lg font-semibold text-[#0d212c]">{content.title}</h1>
      <p className="mt-2 text-sm text-slate-500">{content.description}</p>
      <div className="mt-6 flex flex-col gap-2">
        <Link
          href="/auth/sign-in"
          className="rounded-full bg-[#0d212c] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0d212c]/90"
        >
          Iniciar sesión
        </Link>
        <Link
          href="/"
          className="rounded-full px-5 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:text-[#0d212c]"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
