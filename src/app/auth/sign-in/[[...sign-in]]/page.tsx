import { SignIn } from "@clerk/nextjs";
import { ethicvoiceAuthAppearance } from "@/lib/ethicvoice-clerk-appearance";

export default function Page() {
  return (
    <div className="w-full rounded-3xl border border-emerald-100/70 bg-white/70 p-3 shadow-[0_20px_60px_-42px_rgba(5,26,36,0.6)] backdrop-blur sm:p-4">
      <SignIn appearance={ethicvoiceAuthAppearance} />
    </div>
  );
}
