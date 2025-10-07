import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class UpdateShopDto {
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

  @IsString()
  @IsOptional()
  public gstin?: string;

  @IsNumber()
  @IsOptional()
  public established_year?: number;

  @IsString()
  @IsOptional()
  public shop_logo_url?: string;
}
