import { IsString, IsOptional, IsNumber, IsEnum, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class OrderItemDto {
  @ApiProperty() @IsString() menuItemId: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() variantId?: string;
  @ApiProperty() @IsNumber() @Min(1) quantity: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() notes?: string;
  @ApiProperty({ required: false }) @IsOptional() addons?: any[];
}

export class CreateOrderDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() tableId?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() customerId?: string;
  @ApiProperty({ enum: ['DINE_IN', 'TAKEAWAY', 'DELIVERY', 'ONLINE'] })
  @IsOptional() @IsString() orderType?: string;
  @ApiProperty({ type: [OrderItemDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => OrderItemDto) items: OrderItemDto[];
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @Min(0) discountAmount?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @Min(0) serviceCharge?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @Min(1) guestCount?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() notes?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() source?: string;
  @ApiProperty({ required: false }) @IsOptional() deliveryAddress?: any;
}
