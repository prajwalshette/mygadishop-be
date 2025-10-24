import { IsEmail, IsString, IsNotEmpty, IsOptional, IsJSON } from 'class-validator';
import { Type } from 'class-transformer';

export class OnboardShopDto {
  @IsEmail()
  @IsNotEmpty()
  public email: string;

  @IsString()
  @IsNotEmpty()
  public shop_name: string;

  @IsString()
  @IsNotEmpty()
  public owner_name: string;

  @IsString()
  @IsNotEmpty()
  public phone: string;

  @IsString()
  @IsOptional()
  public website_url?: string;

  @IsString()
  @IsNotEmpty()
  public address: string;

  @IsString()
  @IsNotEmpty()
  public city: string;

  @IsString()
  @IsNotEmpty()
  public state: string;

  @IsString()
  @IsNotEmpty()
  public pincode: string;

  @IsJSON()
  @IsOptional()
  public device_info?: Object;

  @IsString()
  @IsOptional()
  public ip_address?: string;
}
