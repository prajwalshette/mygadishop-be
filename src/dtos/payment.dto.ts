import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsArray} from 'class-validator';
import { PaymentMethod, PaymentStatus } from '@/interfaces/vehiclePayment.interface';

export class CreateVehiclePaymentDto {
  @IsString()
  @IsNotEmpty()
  public vehicle_id: string;

  @IsString()
  @IsNotEmpty()
  public customer_id: string;

  @IsNumber()
  @IsNotEmpty()
  public amount: number;

  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  public method: PaymentMethod;

  @IsEnum(PaymentStatus)
  @IsNotEmpty()
  public status: PaymentStatus;

  @IsArray()
  @IsOptional()
  public payment_receipt_images?: string[];

  @IsString()
  @IsOptional()
  public message?: string;
}

export class UpdateVehiclePaymentDto {
  @IsNumber()
  @IsOptional()
  public amount?: number;

  @IsEnum(PaymentMethod)
  @IsOptional()
  public method?: PaymentMethod;

  @IsEnum(PaymentStatus)
  @IsOptional()
  public status?: PaymentStatus;

  @IsArray()
  @IsOptional()
  public payment_receipt_images?: string[];

  @IsString()
  @IsOptional()
  public message?: string;
}
