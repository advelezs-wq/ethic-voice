import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { ModernPDFGeneratorService } from "@/modules/app/services/pdf-generator.service";
import { isSuperAdmin } from "@/modules/core/utils/permissions";

// `id` is a small sequential PaymentTransaction id — trivially
// guessable/enumerable. Without checking the
// resolved org against the caller, anyone signed in could download any
// other organization's invoice: buyer name/email/phone/address, amount,
// payment method, provider transaction id.
async function assertCanAccessOrgInvoice(
  userId: string,
  orgId: string | null | undefined
): Promise<boolean> {
  if (!orgId) return false;
  const [membership, user] = await Promise.all([
    prisma.organizationMembership.findUnique({
      where: { userId_orgId: { userId, orgId } },
    }),
    currentUser(),
  ]);
  if (membership) return true;
  const email = user?.primaryEmailAddress?.emailAddress;
  return Boolean(email && isSuperAdmin(email));
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    // Normalize identifier: support "mp-<id>", "tx-<id>" or plain numeric ids
    const isTx = /^tx-?\d+$/i.test(id) || /^\d+$/.test(id);
    const txIdStr = isTx ? id.replace(/^tx-?/i, "") : null;
    const txId = txIdStr && /^\d+$/.test(txIdStr) ? Number(txIdStr) : null;

    // Try resolve as PaymentTransaction when we have a numeric id
    const tx = txId
      ? await prisma.paymentTransaction.findFirst({
          where: { id: txId },
          include: { subscription: true, organization: true },
        })
      : null;

    let seller = {
      name: "EthicVoice",
      nit: process.env.ETHICVOICE_NIT || "N/A",
      address: process.env.ETHICVOICE_ADDRESS || "",
      email: process.env.ETHICVOICE_EMAIL || "support@ethicvoice.co",
      phone: process.env.ETHICVOICE_PHONE || "",
    };

    let buyer = {
      name: "",
      document: "",
      email: "",
      phone: "",
      address: "",
    } as any;
    let invoice: any = {
      id,
      number: id,
      currency: "COP",
      items: [],
      subtotal: 0,
      taxes: 0,
      total: 0,
    };
    let organizationLogo: string | undefined;

    if (tx && !(await assertCanAccessOrgInvoice(userId, tx.orgId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (tx) {
      // Map internal transaction
      const amount = Number(tx.amount || 0);
      invoice = {
        id: String(tx.id),
        number: String(tx.id),
        issueDate: tx.transactionDate || tx.createdAt,
        currency: tx.currency || "COP",
        status: tx.status,
        paymentMethod: tx.gateway === "WOMPI" ? "Tarjeta (Wompi)" : "Manual",
        providerId: tx.providerTransactionId || undefined,
        items: [
          {
            description: (tx as any).description || "Pago de suscripción",
            quantity: 1,
            unitPrice: amount,
          },
        ],
        subtotal: amount,
        taxes: 0,
        total: amount,
      };

      if (tx.organization) {
        buyer = {
          name: tx.organization.name || "Organización",
          document: tx.organization.id,
          email: "",
        };
        organizationLogo = tx.organization.logoUrl || undefined;
      }
    } else {
      return NextResponse.json(
        { error: "Invalid invoice id format" },
        { status: 400 }
      );
    }

    const generator = new ModernPDFGeneratorService();
    // EthicVoice logo is embedded inside generator via getImageAsBase64 and base template header
    const pdf = await generator.generateInvoicePDF({
      seller,
      buyer,
      invoice,
      organizationLogo,
    });

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoice.number}.pdf"`,
      },
    });
  } catch (e) {
    console.error("❌ [INVOICE] Failed to generate invoice", e);
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 }
    );
  }
}
