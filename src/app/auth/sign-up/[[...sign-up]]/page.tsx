import { SignUp } from "@clerk/nextjs";
import { ethicvoiceAuthAppearance } from "@/lib/ethicvoice-clerk-appearance";

export default function Page() {
  return (
    <div className="w-full">
      <SignUp appearance={ethicvoiceAuthAppearance} />
    </div>
  );
}
