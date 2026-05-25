import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create new order' })
  async create(@Req() req: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(req.user.tenantId, req.user.branchId, req.user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  async findAll(@Req() req: any, @Query() query: any) {
    return this.ordersService.getOrders(req.user.tenantId, req.user.branchId, query);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard stats' })
  async getDashboard(@Req() req: any) {
    return this.ordersService.getDashboardStats(req.user.tenantId, req.user.branchId);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.ordersService.getOrderById(req.user.tenantId, id);
  }

  @Patch(':id/status')
  async updateStatus(@Req() req: any, @Param('id') id: string, @Body() body: { status: string }) {
    return this.ordersService.updateOrderStatus(req.user.tenantId, id, body.status, req.user.sub);
  }

  @Post(':id/items')
  async addItems(@Req() req: any, @Param('id') id: string, @Body() body: { items: any[] }) {
    return this.ordersService.addItemsToOrder(req.user.tenantId, id, body.items, req.user.sub);
  }
}
