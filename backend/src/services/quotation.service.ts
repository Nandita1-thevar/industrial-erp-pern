import { prisma } from '../config/prisma';
import { calculateQuotation } from '../utils/numbers';

export async function createQuotation(data: {
  enquiryId: number;
  validUntil: Date;
  items: {
    productId: number;
    quantity: number;
    unitPrice: number;
    discountPct: number;
    gstPct: number;
  }[];
}) {
  const enquiry = await prisma.enquiry.findUnique({
    where: { id: data.enquiryId },
    include: {
      items: true,
      customer: true,
    },
  });

  if (!enquiry) {
    throw Object.assign(new Error('Enquiry not found'), {
      status: 404,
    });
  }

  const allowedProducts = new Set(
    enquiry.items.map((item) => item.productId)
  );

  const invalidProduct = data.items.some(
    (item) => !allowedProducts.has(item.productId)
  );

  if (invalidProduct) {
    throw Object.assign(
      new Error('Quotation contains a product not present in the enquiry'),
      { status: 400 }
    );
  }

  const totals = calculateQuotation(data.items);

  return prisma.$transaction(async (tx) => {
    const quotation = await tx.quotation.create({
      data: {
        quotationNo: `QUO-${Date.now()}`,
        enquiryId: data.enquiryId,
        validUntil: data.validUntil,
        subtotal: totals.subtotal,
        discountAmount: totals.discount,
        gstAmount: totals.gst,
        grandTotal: totals.grandTotal,

        items: {
          create: data.items.map((item) => {
            const grossAmount = item.quantity * item.unitPrice;

            const discountAmount =
              grossAmount * (item.discountPct / 100);

            const taxableAmount =
              grossAmount - discountAmount;

            const gstAmount =
              taxableAmount * (item.gstPct / 100);

            const lineAmount =
              taxableAmount + gstAmount;

            return {
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discountPct: item.discountPct,
              gstPct: item.gstPct,
              lineAmount,
            };
          }),
        },
      },

      include: {
        items: true,
        enquiry: {
          include: {
            customer: true,
          },
        },
      },
    });

    await tx.enquiry.update({
      where: {
        id: data.enquiryId,
      },
      data: {
        status: 'QUOTED',
      },
    });

    return quotation;
  });
}