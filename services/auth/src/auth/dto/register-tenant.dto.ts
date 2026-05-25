import { IsEmail, IsString, IsNotEmpty, MinLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterTenantDto {
  @ApiProperty({ example: 'The Grand Cafe' })
  @IsString()
  @IsNotEmpty()
  restaurantName: string;

  @ApiProperty({ example: 'grand-cafe' })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug can only contain lowercase letters, numbers, and hyphens' })
  slug: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'owner@grandcafe.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'StrongPass@123' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must have uppercase, lowercase, number, and special character',
  })
  password: string;

  @ApiProperty({ required: false, example: 'INR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ required: false, example: 'Asia/Kolkata' })
  @IsOptional()
  @IsString()
  timezone?: string;
}
