import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  async getCategories(tenantId: string, branchId?: string) {
    return this.prisma.menuCategory.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getItems(tenantId: string, query?: { categoryId?: string; search?: string; available?: boolean }) {
    return this.prisma.menuItem.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(query?.categoryId ? { categoryId: query.categoryId } : {}),
        ...(query?.available !== undefined ? { isAvailable: query.available } : {}),
        ...(query?.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
      },
      include: { variants: true, addons: true, category: { select: { name: true } } },
      orderBy: { name: 'asc' },
    });
  }
}
