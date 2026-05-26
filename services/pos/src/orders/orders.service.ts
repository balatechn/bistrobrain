import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { PosGateway } from '../pos.gateway';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private posGateway: PosGateway,
  ) {}

  async createOrder(tenantId: string, branchId: string, userId: string, dto: CreateOrderDto) {
    const orderNumber = await this.generateOrderNumber(tenantId, branchId);

    // Validate and price menu items
    const menuItemIds = dto.items.map((i) => i.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, tenantId, isActive: true },
      include: { taxCategory: true, variants: true },
    });

    if (menuItems.length !== menuItemIds.length) {
      throw new BadRequestException('One or more menu items not found or inactive');
    }

    const itemsMap = new Map(menuItems.map((m) => [m.id, m]));
    let subtotal = 0;
    let taxAmount = 0;
    const orderItems: any[] = [];

    for (const item of dto.items) {
      const menuItem = itemsMap.get(item.menuItemId)!;
      const variant = item.variantId
        ? menuItem.variants.find((v) => v.id === item.variantId)
        : null;
      const unitPrice = Number(variant?.price ?? menuItem.basePrice);
      const itemSubtotal = unitPrice * item.quantity;
      const taxRate = Number(menuItem.taxCategory?.rate ?? 0);
      const itemTax = (itemSubtotal * taxRate) / 100;

      subtotal += itemSubtotal;
      taxAmount += itemTax;

      orderItems.push({
        menuItemId: item.menuItemId,
        variantId: item.variantId || null,
        name: menuItem.name,
        quantity: item.quantity,
        unitPrice,
        taxAmount: itemTax,
        totalAmount: itemSubtotal + itemTax,
        notes: item.notes,
        addons: item.addons,
      });
    }

    const discountAmount = dto.discountAmount || 0;
    const serviceCharge = dto.serviceCharge || 0;
    const totalAmount = subtotal + taxAmount - discountAmount + serviceCharge;

    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          tenantId,
          branchId,
          tableId: dto.tableId,
          customerId: dto.customerId,
          createdById: userId,
          orderNumber,
          orderType: (dto.orderType || 'DINE_IN') as any,
          status: 'PENDING',
          paymentStatus: 'UNPAID',
          subtotal,
          discountAmount,
          taxAmount,
          serviceCharge,
          totalAmount,
          guestCount: dto.guestCount || 1,
          notes: dto.notes,
          source: (dto.source || 'POS') as any,
          orderItems: {
            create: orderItems,
          },
        },
        include: {
          orderItems: { include: { menuItem: true } },
          table: true,
          customer: true,
        },
      });

      // Update table status if dine-in
      if (dto.tableId && dto.orderType === 'DINE_IN') {
        await tx.table.update({
          where: { id: dto.tableId },
          data: { status: 'OCCUPIED' },
        });
      }

      return newOrder;
    });

    // Emit real-time event
    this.posGateway.emitOrderUpdate(tenantId, branchId, 'order:new', order);

    return order;
  }

  async getOrders(tenantId: string, branchId: string, query: any) {
    const { status, orderType, date, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId, branchId, deletedAt: null };
    if (status) where.status = status;
    if (orderType) where.orderType = orderType;
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      where.createdAt = { gte: start, lte: end };
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          orderItems: { include: { menuItem: { select: { name: true, image: true } } } },
          table: { select: { name: true } },
          customer: { select: { firstName: true, lastName: true, phone: true } },
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.order.count({ where }),
    ]);

    return { orders, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getOrderById(tenantId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId, deletedAt: null },
      include: {
        orderItems: { include: { menuItem: true, variant: true } },
        table: true,
        customer: true,
        payments: true,
        kots: { include: { items: true } },
        taxBreakdown: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateOrderStatus(tenantId: string, orderId: string, status: string, userId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, tenantId } });
    if (!order) throw new NotFoundException('Order not found');

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: status as any,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
        cancelledAt: status === 'CANCELLED' ? new Date() : undefined,
      },
    });

    // Free up table if order is completed/cancelled
    if (['COMPLETED', 'CANCELLED'].includes(status) && order.tableId) {
      const activeOrders = await this.prisma.order.count({
        where: {
          tableId: order.tableId,
          status: { notIn: ['COMPLETED', 'CANCELLED', 'VOID'] },
          id: { not: orderId },
        },
      });
      if (activeOrders === 0) {
        await this.prisma.table.update({
          where: { id: order.tableId },
          data: { status: 'AVAILABLE' },
        });
      }
    }

    this.posGateway.emitOrderUpdate(tenantId, order.branchId, 'order:status', updated);
    return updated;
  }

  async addItemsToOrder(tenantId: string, orderId: string, items: any[], userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
    });
    if (!order) throw new NotFoundException('Order not found or cannot be modified');

    let addSubtotal = 0;
    let addTax = 0;
    const newItems: any[] = [];

    for (const item of items) {
      const menuItem = await this.prisma.menuItem.findFirst({
        where: { id: item.menuItemId, tenantId },
        include: { taxCategory: true },
      });
      if (!menuItem) throw new BadRequestException(`Menu item ${item.menuItemId} not found`);

      const unitPrice = Number(menuItem.basePrice);
      const itemSubtotal = unitPrice * item.quantity;
      const taxRate = Number(menuItem.taxCategory?.rate ?? 0);
      const itemTax = (itemSubtotal * taxRate) / 100;

      addSubtotal += itemSubtotal;
      addTax += itemTax;
      newItems.push({ orderId, menuItemId: item.menuItemId, name: menuItem.name, quantity: item.quantity, unitPrice, taxAmount: itemTax, totalAmount: itemSubtotal + itemTax, notes: item.notes });
    }

    await this.prisma.$transaction([
      this.prisma.orderItem.createMany({ data: newItems }),
      this.prisma.order.update({
        where: { id: orderId },
        data: {
          subtotal: { increment: addSubtotal },
          taxAmount: { increment: addTax },
          totalAmount: { increment: addSubtotal + addTax },
        },
      }),
    ]);

    return this.getOrderById(tenantId, orderId);
  }

  async getDashboardStats(tenantId: string, branchId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todaySales, pendingOrders, activeOrders, topItems] = await Promise.all([
      this.prisma.order.aggregate({
        where: { tenantId, branchId, status: 'COMPLETED', createdAt: { gte: today, lt: tomorrow } },
        _sum: { totalAmount: true },
        _count: true,
      }),
      this.prisma.order.count({
        where: { tenantId, branchId, status: { in: ['PENDING', 'CONFIRMED', 'IN_KITCHEN'] } },
      }),
      this.prisma.order.findMany({
        where: { tenantId, branchId, status: { in: ['PENDING', 'CONFIRMED', 'IN_KITCHEN', 'READY'] } },
        include: { table: true, orderItems: { include: { menuItem: true } } },
        orderBy: { createdAt: 'asc' },
        take: 10,
      }),
      this.prisma.orderItem.groupBy({
        by: ['menuItemId', 'name'],
        where: { order: { tenantId, branchId, createdAt: { gte: today }, status: 'COMPLETED' } },
        _sum: { quantity: true, totalAmount: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    return {
      todaySales: { amount: todaySales._sum.totalAmount || 0, orders: todaySales._count },
      pendingOrders,
      activeOrders,
      topItems,
    };
  }

  private async generateOrderNumber(tenantId: string, branchId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.order.count({
      where: { tenantId, branchId, createdAt: { gte: new Date(today.toDateString()) } },
    });
    return `ORD-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }
}
