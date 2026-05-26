import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PosGateway } from '../pos.gateway';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService, private gateway: PosGateway) {}

  async processPayment(orderId: string, tenantId: string, data: {
    method: string; amount: number; referenceNumber?: string; notes?: string;
  }) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, tenantId } });
    if (!order) throw new NotFoundException('Order not found');

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          tenantId,
          orderId,
          branchId: order.branchId,
          amount: data.amount,
          method: data.method as any,
          referenceNumber: data.referenceNumber,
          notes: data.notes,
          status: 'PAID' as any,
        },
      });
      await tx.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'PAID', status: 'COMPLETED' },
      });
      if (order.tableId) {
        await tx.table.update({ where: { id: order.tableId }, data: { status: 'AVAILABLE' } });
      }
      this.gateway.emitOrderCompleted(tenantId, order.branchId, { orderId } as object);
      return payment;
    });
  }

  async getPayments(tenantId: string, params?: { orderId?: string; from?: Date; to?: Date }) {
    return this.prisma.payment.findMany({
      where: {
        tenantId,
        ...(params?.orderId ? { orderId: params.orderId } : {}),
        ...(params?.from ? { createdAt: { gte: params.from, ...(params.to ? { lte: params.to } : {}) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
