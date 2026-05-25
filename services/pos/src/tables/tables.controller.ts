import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { TablesService } from './tables.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('tables')
export class TablesController {
  constructor(private tables: TablesService) {}

  @Get()
  getTables(@Req() req: any, @Query('branchId') branchId: string) {
    return this.tables.getTables(req.user.tenantId, branchId || req.user.branchId);
  }
}
