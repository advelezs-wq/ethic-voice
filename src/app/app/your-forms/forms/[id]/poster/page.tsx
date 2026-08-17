import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { getFormPosterData } from "@/actions/form";
import { PrintPosterButton } from "@/modules/forms/components/PrintPosterButton";

interface PosterPageProps {
  params: Promise<{ id: string }>;
}

export default async function FormPosterPage({ params }: PosterPageProps) {
  const formId = Number((await params).id);
  if (Number.isNaN(formId)) notFound();

  const poster = await getFormPosterData(formId);
  if (!poster) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const reportUrl = `${baseUrl}/submit/${poster.shareURL}`;
  const qrDataUrl = await QRCode.toDataURL(reportUrl, {
    width: 480,
    margin: 1,
    color: { dark: "#0a1e14", light: "#ffffff" },
  });

  return (
    <div className="container mx-auto px-4 py-8 print:p-0">
      <div className="print:hidden mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0d212c]">
            Póster de la Línea Ética
          </h1>
          <p className="text-sm text-slate-500">
            Imprime este afiche y colócalo en tu oficina o intranet física
          </p>
        </div>
        <PrintPosterButton />
      </div>

      {/* Print-only isolation: hide everything else on the page when
          printing, regardless of what dashboard chrome wraps this route. */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #ethics-poster, #ethics-poster * { visibility: visible; }
          #ethics-poster {
            position: absolute;
            inset: 0;
            margin: 0;
          }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>

      <div
        id="ethics-poster"
        className="mx-auto max-w-2xl border border-[#0a1e14]/10 rounded-3xl bg-white p-12 text-center shadow-[0_20px_60px_-35px_rgba(10,30,20,0.4)] print:max-w-none print:border-0 print:rounded-none print:shadow-none print:h-[297mm] print:flex print:flex-col print:justify-center"
      >
        {poster.orgLogoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poster.orgLogoUrl}
            alt={poster.orgName}
            className="h-16 mx-auto mb-6 object-contain"
          />
        )}

        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 mb-2">
          {poster.orgName}
        </p>
        <h2 className="text-4xl font-bold text-[#0a1e14] mb-4">
          Línea Ética
        </h2>
        <p className="text-lg text-[#273c46] mb-8 max-w-lg mx-auto">
          ¿Fuiste testigo de algo que no está bien? Repórtalo de forma
          confidencial. Escanea el código o visita el enlace.
        </p>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt="Código QR para reportar"
          className="mx-auto mb-6 w-64 h-64"
        />

        <p className="text-sm font-mono text-[#0a1e14] break-all mb-8">
          {reportUrl}
        </p>

        <div className="border-t border-[#0a1e14]/10 pt-6">
          <p className="text-sm text-[#273c46]">
            Tu identidad se protege. Puedes reportar de forma anónima.
          </p>
        </div>
      </div>
    </div>
  );
}
