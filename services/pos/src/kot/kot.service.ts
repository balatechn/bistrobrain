import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PosGateway } from '../pos.gateway';

@Injectable()
export class KotService {
  constructor(private prisma: PrismaService, private gateway: PosGateway) {}

  async createKOT(orderId: string, tenantId: string, branchId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
      include: { orderItems: { include: { menuItem: true } } },
    });
    if (!order) throw new Error('Order not found');

    const kotNumber = `KOT-${Date.now().toString(36).toUpperCase()}`;

    const kot = await this.prisma.$transaction(async (tx) => {
      const k = await tx.kOT.create({
        data: {
          tenantId,
          branchId,
          orderId,
          kotNumber,
          status: 'PENDING',
          kotItems: {
            create: order.orderItems.map((item) => ({
              tenantId,
              menuItemId: item.menuItemId,
              menuItemName: item.menuItem.name,
              quantity: item.quantity,
              notes: item.notes,
            })),
          },
        },
        include: { kotItems: true },
      });
      await tx.order.update({ where: { id: orderId }, data: { status: 'IN_KITCHEN' } });
      return k;
    });

    this.gateway.emitKOTUpdate(tenantId, branchId, kot);
    return kot;
  }

  async getActiveKOTs(tenantId: string, branchId: string) {
    return this.prisma.kOT.findMany({
      where: { tenantId, branchId, status: { not: 'SERVED' } },
      include: { kotItems: true, order: { select: { orderNumber: true, orderType: true, table: { select: { name: true } } } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateKOTStatus(id: string, tenantId: string, status: string) {
    const kot = await this.prisma.kOT.update({
      where: { id },
      data: { status: status as any, ...(status === 'READY' ? { completedAt: new Date() } : {}) },
    });
    this.gateway.emitKOTUpdate(tenantId, kot.branchId, kot);
    return kot;
  }
}
