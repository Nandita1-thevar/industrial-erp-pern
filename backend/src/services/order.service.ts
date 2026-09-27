import { prisma } from '../config/prisma';

function appError(message: string, status: number) {
  return Object.assign(new Error(message), { status });
}

export async function convertQuotation(quotationId: number) {
  return prisma.$transaction(async (tx) => {
    const quotation = await tx.quotation.findUnique({
      where: { id: quotationId },
      include: {
        items: true,
        enquiry: true,
      },
    });

    if (!quotation) {
      throw appError('Quotation not found', 404);
    }

    if (quotation.status !== 'ACCEPTED') {
      throw appError(
        'Only ACCEPTED quotations can create Sales Orders',
        400
      );
    }

    const existingOrder = await tx.salesOrder.findUnique({
      where: { quotationId },
    });

    if (existingOrder) {
      throw appError(
        'This quotation already has a Sales Order',
        409
      );
    }

    return tx.salesOrder.create({
      data: {
        orderNo: `SO-${Date.now()}`,
        quotationId,
        customerId: quotation.enquiry.customerId,
        totalAmount: quotation.grandTotal,

        items: {
          create: quotation.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },

      include: {
        items: true,
        customer: true,
        quotation: true,
      },
    });
  });
}

export async function confirmOrder(orderId: number) {
  return prisma.$transaction(
    async (tx) => {
      const order = await tx.salesOrder.findUnique({
        where: { id: orderId },
        include: {
          items: true,
        },
      });

      if (!order) {
        throw appError('Sales Order not found', 404);
      }

      if (order.status !== 'PENDING') {
        throw appError(
          'Only PENDING orders can be confirmed',
          400
        );
      }

      /*
       * Lock inventory rows before checking availability.
       *
       * This prevents two simultaneous confirmation requests
       * from reserving the same available stock.
       */

      const productIds = order.items
        .map((item) => item.productId)
        .sort((a, b) => a - b);

      const inventoryRows: any[] = [];

      for (const productId of productIds) {
        const rows = await tx.$queryRaw<any[]>`
          SELECT
            id,
            "productId",
            "physicalQty",
            "reservedQty"
          FROM "Inventory"
          WHERE "productId" = ${productId}
          FOR UPDATE
        `;

        if (!rows[0]) {
          throw appError(
            `Inventory not found for product ${productId}`,
            400
          );
        }

        inventoryRows.push(rows[0]);
      }

      /*
       * Check stock while the inventory rows are locked.
       */
      for (const item of order.items) {
        const inventory = inventoryRows.find(
          (row) => row.productId === item.productId
        );

        const physical = Number(inventory.physicalQty);
        const reserved = Number(inventory.reservedQty);
        const available = physical - reserved;

        if (Number(item.quantity) > available) {
          throw appError(
            `Insufficient stock for product ${item.productId}. Available: ${available}`,
            409
          );
        }
      }

      /*
       * Reserve the stock.
       *
       * Physical quantity is NOT reduced here.
       */
      for (const item of order.items) {
        const inventory = inventoryRows.find(
          (row) => row.productId === item.productId
        );

        await tx.inventory.update({
          where: {
            id: inventory.id,
          },

          data: {
            reservedQty: {
              increment: item.quantity,
            },
          },
        });
      }

      return tx.salesOrder.update({
        where: {
          id: orderId,
        },

        data: {
          status: 'CONFIRMED',
        },

        include: {
          items: true,
          customer: true,
        },
      });
    },

    {
      isolationLevel: 'Serializable',
      maxWait: 5000,
      timeout: 10000,
    }
  );
}

export async function dispatchOrder(
  orderId: number,
  data: {
    vehicleNo: string;
    driverName: string;
    items: {
      productId: number;
      quantity: number;
    }[];
  }
) {
  return prisma.$transaction(
    async (tx) => {
      const order = await tx.salesOrder.findUnique({
        where: {
          id: orderId,
        },

        include: {
          items: true,
          dispatches: {
            include: {
              items: true,
            },
          },
        },
      });

      if (!order) {
        throw appError('Sales Order not found', 404);
      }

      if (order.status === 'CANCELLED') {
        throw appError(
          'Cancelled order cannot be dispatched',
          400
        );
      }

      if (order.status !== 'CONFIRMED') {
        throw appError(
          'Only CONFIRMED orders can be dispatched',
          400
        );
      }

      /*
       * Prevent duplicate product entries in one dispatch.
       */
      const productIds = data.items.map(
        (item) => item.productId
      );

      if (
        new Set(productIds).size !==
        productIds.length
      ) {
        throw appError(
          'A product can appear only once in a dispatch',
          400
        );
      }

      /*
       * Calculate how much has already been dispatched.
       */
      const alreadyDispatched = new Map<
        number,
        number
      >();

      for (const dispatch of order.dispatches) {
        for (const item of dispatch.items) {
          alreadyDispatched.set(
            item.productId,
            (alreadyDispatched.get(item.productId) || 0) +
              Number(item.quantity)
          );
        }
      }

      /*
       * Validate requested dispatch quantities.
       */
      for (const item of data.items) {
        const orderItem = order.items.find(
          (orderItem) =>
            orderItem.productId === item.productId
        );

        if (!orderItem) {
          throw appError(
            `Product ${item.productId} is not part of this order`,
            400
          );
        }

        const previouslyDispatched =
          alreadyDispatched.get(item.productId) || 0;

        const remaining =
          Number(orderItem.quantity) -
          previouslyDispatched;

        if (item.quantity <= 0) {
          throw appError(
            'Dispatch quantity must be greater than zero',
            400
          );
        }

        if (item.quantity > remaining) {
          throw appError(
            `Dispatch quantity exceeds remaining order quantity for product ${item.productId}`,
            409
          );
        }
      }

      /*
       * Lock inventory rows before modifying them.
       *
       * IMPORTANT:
       * PostgreSQL column names are camelCase in the Prisma
       * schema, so they must be quoted here.
       */
      const ids = [...productIds].sort(
        (a, b) => a - b
      );

      const inventoryRows: any[] = [];

      for (const productId of ids) {
        const rows = await tx.$queryRaw<any[]>`
          SELECT
            id,
            "productId",
            "physicalQty",
            "reservedQty"
          FROM "Inventory"
          WHERE "productId" = ${productId}
          FOR UPDATE
        `;

        if (!rows[0]) {
          throw appError(
            `Inventory not found for product ${productId}`,
            400
          );
        }

        inventoryRows.push(rows[0]);
      }

      /*
       * Dispatch cannot exceed reserved stock
       * or physical stock.
       */
      for (const item of data.items) {
        const inventory = inventoryRows.find(
          (row) => row.productId === item.productId
        );

        if (
          Number(inventory.reservedQty) <
          item.quantity
        ) {
          throw appError(
            `Dispatch exceeds reserved stock for product ${item.productId}`,
            409
          );
        }

        if (
          Number(inventory.physicalQty) <
          item.quantity
        ) {
          throw appError(
            `Dispatch exceeds physical stock for product ${item.productId}`,
            409
          );
        }
      }

      /*
       * Create dispatch record.
       */
      const dispatch = await tx.dispatch.create({
        data: {
          dispatchNo: `DSP-${Date.now()}`,
          salesOrderId: orderId,
          vehicleNo: data.vehicleNo,
          driverName: data.driverName,

          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          },
        },

        include: {
          items: true,
        },
      });

      /*
       * Dispatch consumes the reservation.
       *
       * Physical stock decreases.
       * Reserved stock also decreases.
       */
      for (const item of data.items) {
        const inventory = inventoryRows.find(
          (row) => row.productId === item.productId
        );

        await tx.inventory.update({
          where: {
            id: inventory.id,
          },

          data: {
            physicalQty: {
              decrement: item.quantity,
            },

            reservedQty: {
              decrement: item.quantity,
            },
          },
        });
      }

      /*
       * Determine whether every order item has now
       * been completely dispatched.
       */
      const fullyDispatched =
        order.items.every((orderItem) => {
          const previous =
            alreadyDispatched.get(
              orderItem.productId
            ) || 0;

          const currentDispatch =
            data.items.find(
              (item) =>
                item.productId ===
                orderItem.productId
            )?.quantity || 0;

          return (
            previous + currentDispatch >=
            Number(orderItem.quantity)
          );
        });

      if (fullyDispatched) {
        await tx.salesOrder.update({
          where: {
            id: orderId,
          },

          data: {
            status: 'DISPATCHED',
          },
        });
      }

      return dispatch;
    },

    {
      isolationLevel: 'Serializable',
      maxWait: 5000,
      timeout: 10000,
    }
  );
}