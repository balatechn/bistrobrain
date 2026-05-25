import { Controller, Post, Get, Param, Body, UseGuards, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @Post(':orderId')
  processPayment(@Param('orderId') orderId: string, @Req() req: any, @Body() body: any) {
    return this.payments.processPayment(orderId, req.user.tenantId, body);
  }

  @Get()
  getPayments(@Req() req: any) {
    return this.payments.getPayments(req.user.tenantId);
  }
}
