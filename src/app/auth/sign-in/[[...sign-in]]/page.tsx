import { SignIn } from "@clerk/nextjs";
import { ethicvoiceAuthAppearance } from "@/lib/ethicvoice-clerk-appearance";

export default function Page() {
  return <SignIn appearance={ethicvoiceAuthAppearance} />;
}
