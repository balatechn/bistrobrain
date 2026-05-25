import { Controller, Post, Get, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { KotService } from './kot.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('kot')
export class KotController {
  constructor(private kot: KotService) {}

  @Post(':orderId')
  createKOT(@Param('orderId') orderId: string, @Req() req: any) {
    return this.kot.createKOT(orderId, req.user.tenantId, req.user.branchId);
  }

  @Get()
  getActiveKOTs(@Req() req: any, @Query('branchId') branchId: string) {
    return this.kot.getActiveKOTs(req.user.tenantId, branchId || req.user.branchId);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Req() req: any, @Body('status') status: string) {
    return this.kot.updateKOTStatus(id, req.user.tenantId, status);
  }
}
