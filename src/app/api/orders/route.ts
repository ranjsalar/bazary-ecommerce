import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { checkoutSchema, fieldErrors } from "@/lib/validation";
import { getSettings } from "@/lib/settings";
import { verifyOrderOtp } from "@/lib/otp";

// Creates an order. Ordering requires a signed-in account (no guest
// checkout). Everything money-related is re-derived server-side: product
// prices come from the DB, the delivery fee is looked up fresh, and stock is
// checked and decremented inside a transaction. When checkout OTP is enabled,
// the WhatsApp number must have a verified code before anything runs.
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ errors: { _form: "errors.loginRequired" } }, { status: 401 });
    }
    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });
    }
    const input = parsed.data;

    // Two-factor gate: the code sent to the customer's WhatsApp must check out.
    const settings = await getSettings();
    if (settings.otpEnabled) {
      if (!input.otpCode || input.otpCode.length !== 6) {
        return NextResponse.json({ errors: { otp: "errors.otpRequired" } }, { status: 400 });
      }
      const verdict = await verifyOrderOtp(input.whatsapp, input.otpCode);
      if (!verdict.ok) {
        return NextResponse.json({ errors: { otp: `errors.${verdict.error}` } }, { status: 400 });
      }
    }

    // Delivery fee must exist and be active for the selected city.
    const feeRecord = await prisma.deliveryFee.findUnique({ where: { city: input.city } });
    if (!feeRecord || !feeRecord.active) {
      return NextResponse.json(
        { errors: { city: `errors.cityUnavailable|city=${input.city}` } },
        { status: 400 }
      );
    }

    const order = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const itemsData: {
        productId: string;
        name: string;
        variant: string | null;
        unitPrice: number;
        quantity: number;
        image: string | null;
      }[] = [];

      for (const line of input.items) {
        const product = await tx.product.findUnique({
          where: { id: line.productId },
          include: { images: { orderBy: { sort: "asc" }, take: 1 }, variants: true },
        });
        if (!product || !product.active) {
          throw new CheckoutError("errors.productUnavailable");
        }

        let unitPrice = product.price;
        let variantName: string | null = null;

        if (line.variantId) {
          const variant = product.variants.find((v) => v.id === line.variantId);
          if (!variant) {
            throw new CheckoutError(`errors.variantUnavailable|name=${product.name}`);
          }
          if (variant.stock < line.quantity) {
            throw new CheckoutError(
              `errors.onlyNLeft|n=${variant.stock}|name=${product.name} (${variant.name})`
            );
          }
          unitPrice += variant.priceDiff;
          variantName = variant.name;
          await tx.productVariant.update({
            where: { id: variant.id },
            data: { stock: { decrement: line.quantity } },
          });
        } else {
          if (product.stock < line.quantity) {
            throw new CheckoutError(`errors.onlyNLeft|n=${product.stock}|name=${product.name}`);
          }
          await tx.product.update({
            where: { id: product.id },
            data: { stock: { decrement: line.quantity } },
          });
        }

        subtotal += unitPrice * line.quantity;
        itemsData.push({
          productId: product.id,
          name: product.name,
          variant: variantName,
          unitPrice,
          quantity: line.quantity,
          image: product.images[0]?.url ?? null,
        });
      }

      const last = await tx.order.findFirst({
        orderBy: { orderNumber: "desc" },
        select: { orderNumber: true },
      });
      const orderNumber = (last?.orderNumber ?? 1000) + 1;

      return tx.order.create({
        data: {
          orderNumber,
          userId: session.user.id,
          status: "PENDING",
          fullName: input.fullName,
          whatsapp: input.whatsapp,
          city: input.city,
          district: input.district,
          landmark: input.landmark || null,
          addressNotes: input.addressNotes || null,
          orderNotes: input.orderNotes || null,
          subtotal,
          deliveryFee: feeRecord.fee,
          total: subtotal + feeRecord.fee,
          paymentMethod: "COD",
          paymentStatus: "UNPAID",
          items: { create: itemsData },
        },
      });
    });

    return NextResponse.json({ ok: true, orderId: order.id, orderNumber: order.orderNumber });
  } catch (e) {
    if (e instanceof CheckoutError) {
      return NextResponse.json({ errors: { _form: e.message } }, { status: 400 });
    }
    console.error("order create error", e);
    return NextResponse.json(
      { errors: { _form: "errors.couldNotPlaceOrder" } },
      { status: 500 }
    );
  }
}

class CheckoutError extends Error {}
