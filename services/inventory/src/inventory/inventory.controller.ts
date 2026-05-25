import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('inventory')
export class InventoryController {
  constructor(private inventory: InventoryService) {}

  @Get('items')
  getItems(@Req() req: any, @Query() query: any) {
    return this.inventory.getItems(req.user.tenantId, query);
  }

  @Get('alerts')
  getLowStockAlerts(@Req() req: any) {
    return this.inventory.getLowStockAlerts(req.user.tenantId);
  }

  @Post('items')
  createItem(@Req() req: any, @Body() body: any) {
    return this.inventory.createItem(req.user.tenantId, body);
  }

  @Post('items/:id/adjust')
  adjustStock(@Param('id') id: string, @Req() req: any, @Body() body: any) {
    return this.inventory.adjustStock(id, req.user.tenantId, body.type, body.quantity, body.notes);
  }

  @Post('grn')
  processGRN(@Req() req: any, @Body() body: any) {
    return this.inventory.processGRN(req.user.tenantId, body);
  }

  @Get('ledger/:itemId')
  getStockLedger(@Param('itemId') itemId: string, @Req() req: any) {
    return this.inventory.getStockLedger(itemId, req.user.tenantId);
  }
}
