import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private prisma: PrismaService) {}

  async getItems(tenantId: string, branchId: string, query: any) {
    const { search, categoryId, lowStock, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;
    const where: any = { tenantId, branchId, deletedAt: null };
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (categoryId) where.categoryId = categoryId;
    if (lowStock === 'true') {
      const lowIds: Array<{id: string}> = await this.prisma.$queryRaw`SELECT id FROM inventory_items WHERE "tenantId" = ${tenantId} AND "branchId" = ${branchId} AND "deletedAt" IS NULL AND "currentStock" <= "minStock"`;
      where.id = { in: lowIds.map((r: any) => r.id) };
    }

    const [items, total] = await Promise.all([
      this.prisma.inventoryItem.findMany({ where, skip, take: Number(limit), orderBy: { name: 'asc' } }),
      this.prisma.inventoryItem.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async getLowStockAlerts(tenantId: string, branchId: string) {
    return this.prisma.$queryRaw`
      SELECT id, name, sku, unit, "currentStock", "minStock", "reorderLevel"
      FROM inventory_items
      WHERE "tenantId" = ${tenantId}
        AND "branchId" = ${branchId}
        AND "deletedAt" IS NULL
        AND "isActive" = true
        AND "currentStock" <= "minStock"
      ORDER BY ("currentStock" - "minStock") ASC
    `;
  }

  async createItem(tenantId: string, branchId: string, data: any) {
    const existing = await this.prisma.inventoryItem.findFirst({
      where: { tenantId, branchId, sku: data.sku },
    });
    if (existing) throw new BadRequestException('Item with this SKU already exists');

    return this.prisma.inventoryItem.create({
      data: { ...data, tenantId, branchId, currentStock: 0 },
    });
  }

  async adjustStock(tenantId: string, branchId: string, data: any, userId: string) {
    const { itemId, quantity, type, notes, unitCost } = data;
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id: itemId, tenantId, branchId },
    });
    if (!item) throw new NotFoundException('Inventory item not found');

    const openingStock = Number(item.currentStock);
    let closingStock: number;

    if (type === 'ADD') {
      closingStock = openingStock + Number(quantity);
    } else if (type === 'REMOVE') {
      closingStock = openingStock - Number(quantity);
      if (closingStock < 0) throw new BadRequestException('Insufficient stock');
    } else if (type === 'SET') {
      closingStock = Number(quantity);
    } else {
      throw new BadRequestException('Invalid adjustment type');
    }

    await this.prisma.$transaction([
      this.prisma.inventoryItem.update({
        where: { id: itemId },
        data: { currentStock: closingStock },
      }),
      this.prisma.stockLedger.create({
        data: {
          tenantId,
          branchId,
          inventoryItemId: itemId,
          transactionType: `ADJUSTMENT_${type}`,
          quantity: Number(quantity),
          openingStock,
          closingStock,
          unitCost,
          totalCost: unitCost ? unitCost * Number(quantity) : null,
          notes,
          createdById: userId,
        },
      }),
    ]);

    return { message: 'Stock adjusted successfully', openingStock, closingStock };
  }

  async processGRN(tenantId: string, branchId: string, data: any, userId: string) {
    const grnNumber = await this.generateGRNNumber(tenantId);

    const grn = await this.prisma.$transaction(async (tx) => {
      const newGrn = await tx.goodsReceiptNote.create({
        data: {
          tenantId,
          branchId,
          purchaseOrderId: data.purchaseOrderId,
          vendorId: data.vendorId,
          grnNumber,
          invoiceNumber: data.invoiceNumber,
          invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : null,
          subtotal: data.subtotal,
          taxAmount: data.taxAmount || 0,
          totalAmount: data.totalAmount,
          status: 'CONFIRMED',
          notes: data.notes,
          items: { create: data.items },
        },
        include: { items: true },
      });

      // Update inventory stock for each item
      for (const item of data.items) {
        const invItem = await tx.inventoryItem.findFirst({
          where: { id: item.inventoryItemId, tenantId, branchId },
        });
        if (invItem) {
          const opening = Number(invItem.currentStock);
          const closing = opening + Number(item.acceptedQty);
          await tx.inventoryItem.update({
            where: { id: item.inventoryItemId },
            data: { currentStock: closing },
          });
          await tx.stockLedger.create({
            data: {
              tenantId,
              branchId,
              inventoryItemId: item.inventoryItemId,
              transactionType: 'GRN',
              referenceType: 'GRN',
              referenceId: newGrn.id,
              quantity: Number(item.acceptedQty),
              openingStock: opening,
              closingStock: closing,
              unitCost: Number(item.unitPrice),
              totalCost: Number(item.unitPrice) * Number(item.acceptedQty),
              createdById: userId,
            },
          });
        }
      }
      return newGrn;
    });

    return grn;
  }

  async getStockLedger(tenantId: string, itemId: string, query: any) {
    const { page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;
    const [ledger, total] = await Promise.all([
      this.prisma.stockLedger.findMany({
        where: { tenantId, inventoryItemId: itemId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.stockLedger.count({ where: { tenantId, inventoryItemId: itemId } }),
    ]);
    return { ledger, total };
  }

  private async generateGRNNumber(tenantId: string): Promise<string> {
    const count = await this.prisma.goodsReceiptNote.count({ where: { tenantId } });
    return `GRN-${String(count + 1).padStart(6, '0')}`;
  }
}
