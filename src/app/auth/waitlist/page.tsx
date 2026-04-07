import { Waitlist } from "@clerk/nextjs";
import { ethicvoiceAuthAppearance } from "@/lib/ethicvoice-clerk-appearance";

export default function Page() {
  return <Waitlist appearance={ethicvoiceAuthAppearance} />;
}
