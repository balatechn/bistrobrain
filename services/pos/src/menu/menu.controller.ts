import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { MenuService } from './menu.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('menu')
export class MenuController {
  constructor(private menu: MenuService) {}

  @Get('categories')
  getCategories(@Req() req: any) {
    return this.menu.getCategories(req.user.tenantId);
  }

  @Get('items')
  getItems(@Req() req: any, @Query() q: any) {
    return this.menu.getItems(req.user.tenantId, q);
  }
}
