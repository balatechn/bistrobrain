import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('inventory')
export class InventoryController {
  constructor(private inventory: InventoryService) {}

  @Get('items')
  getItems(@Req() req: any, @Query() query: any) {
    return this.inventory.getItems(req.user.tenantId, req.user.branchId, query);
  }

  @Get('alerts')
  getLowStockAlerts(@Req() req: any) {
    return this.inventory.getLowStockAlerts(req.user.tenantId, req.user.branchId);
  }

  @Post('items')
  createItem(@Req() req: any, @Body() body: any) {
    return this.inventory.createItem(req.user.tenantId, req.user.branchId, body);
  }

  @Post('items/:id/adjust')
  adjustStock(@Param('id') id: string, @Req() req: any, @Body() body: any) {
    return this.inventory.adjustStock(req.user.tenantId, req.user.branchId, { itemId: id, type: body.type, quantity: body.quantity, notes: body.notes, unitCost: body.unitCost }, req.user.sub);
  }

  @Post('grn')
  processGRN(@Req() req: any, @Body() body: any) {
    return this.inventory.processGRN(req.user.tenantId, req.user.branchId, body, req.user.sub);
  }

  @Get('ledger/:itemId')
  getStockLedger(@Param('itemId') itemId: string, @Req() req: any, @Query() query: any) {
    return this.inventory.getStockLedger(req.user.tenantId, itemId, query);
  }
}
