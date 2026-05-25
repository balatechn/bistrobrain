import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  async getTables(tenantId: string, branchId: string) {
    return this.prisma.table.findMany({
      where: { tenantId, branchId, deletedAt: null },
      orderBy: [{ section: { name: 'asc' } }, { name: 'asc' }],
      include: { section: { select: { name: true } } },
    });
  }

  async updateTableStatus(id: string, tenantId: string, status: string) {
    return this.prisma.table.update({ where: { id }, data: { status: status as any } });
  }
}
