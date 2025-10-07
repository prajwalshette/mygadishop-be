import { IsEmail, IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { CustomerType } from '@interfaces/customer.interface';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  public name: string;

  @IsEmail()
  @IsNotEmpty()
  public email: string;

  @IsString()
  @IsNotEmpty()
  public phone: string;

  @IsString()
  @IsNotEmpty()
  public address: string;

  @IsString()
  @IsOptional()
  public city: string;

  @IsString()
  @IsOptional()
  public state: string;
  
  @IsString()
  @IsOptional()
  public pincode: string;

  @IsEnum(CustomerType)
  @IsNotEmpty()
  public customer_type: CustomerType;
}