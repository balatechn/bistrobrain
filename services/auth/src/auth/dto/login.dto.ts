import { IsEmail, IsString, IsNotEmpty, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'my-restaurant' })
  @IsString()
  @IsNotEmpty()
  tenantSlug: string;

  @ApiProperty({ example: 'admin@restaurant.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password@123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ required: false, example: '123456' })
  @IsOptional()
  @IsString()
  mfaToken?: string;
}
