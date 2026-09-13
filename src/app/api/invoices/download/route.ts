import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import mercadoPagoService from "@/modules/app/services/mercadopago.service";
import { ModernPDFGeneratorService } from "@/modules/app/services/pdf-generator.service";
import { isSuperAdmin } from "@/modules/core/utils/permissions";

// `id` is a small sequential PaymentTransaction id or a MercadoPago payment
// id — both are trivially guessable/enumerable. Without checking the
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
    const isMp = /^mp-?\d+$/i.test(id);
    const isTx = /^tx-?\d+$/i.test(id) || /^\d+$/.test(id);
    const mpId = isMp ? id.replace(/^mp-?/i, "") : null;
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
        paymentMethod: tx.gateway || "Mercado Pago",
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
    } else if (mpId) {
      // Otherwise assume it's a Mercado Pago payment id and fetch it
      const pay = await mercadoPagoService.getPayment(String(mpId));

      // Resolve the owning org via external_reference (our subscription id)
      // and verify access BEFORE building any part of the response — this
      // payment's payer name/email/phone/address is real customer PII.
      const subIdForAuth = parseInt(String(pay?.external_reference || ""), 10);
      const subForAuth = Number.isFinite(subIdForAuth)
        ? await prisma.subscription.findUnique({
            where: { id: subIdForAuth },
            select: { orgId: true },
          })
        : null;
      if (!(await assertCanAccessOrgInvoice(userId, subForAuth?.orgId))) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const amount = Number(pay?.transaction_amount || 0);
      invoice = {
        id: String(pay?.id),
        number: String(pay?.id),
        issueDate: pay?.date_created,
        currency: pay?.currency_id || "COP",
        status: pay?.status,
        paymentMethod: pay?.payment_method?.type || "Mercado Pago",
        externalReference: pay?.external_reference,
        providerId: pay?.id,
        items: [
          {
            description: pay?.description || "Pago EthicVoice",
            quantity: 1,
            unitPrice: amount,
          },
        ],
        subtotal: amount,
        taxes: 0,
        total: amount,
      };

      // Populate buyer from Mercado Pago payer
      const payer = pay?.payer || {};
      const fullName = [payer.first_name, payer.last_name]
        .filter(Boolean)
        .join(" ");
      const phone = payer?.phone
        ? `${payer.phone.area_code || ""} ${payer.phone.number || ""}`.trim()
        : "";
      const address = payer?.address
        ? [
            payer.address.street_name,
            payer.address.street_number,
            payer.address.zip_code,
          ]
            .filter(Boolean)
            .join(" ")
        : "";
      buyer = {
        name: fullName || payer?.email || "",
        document: "",
        email: payer?.email || "",
        phone,
        address,
      };

      // Optional: try to load org logo only (do not override buyer)
      const subId = parseInt(String(pay?.external_reference || ""), 10);
      if (Number.isFinite(subId)) {
        const sub = await prisma.subscription.findUnique({
          where: { id: subId },
          include: { organization: true },
        });
        if (sub?.organization)
          organizationLogo = sub.organization.logoUrl || undefined;
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
