import { SignIn } from "@clerk/nextjs";
import { ethicvoiceAuthAppearance } from "@/lib/ethicvoice-clerk-appearance";

export default function Page() {
  return (
    <div className="w-full">
      <SignIn appearance={ethicvoiceAuthAppearance} />
    </div>
  );
}
