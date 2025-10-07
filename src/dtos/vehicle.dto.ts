import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsArray, IsDateString } from 'class-validator';
import { VehicleType, FuelType, TransmissionType, BikeStatus, OwnershipType } from '@interfaces/vehicle.interface';

export class CreateVehicleDto {
  @IsString()
  @IsOptional()
  customer_id?: string;

  @IsEnum(VehicleType)
  @IsNotEmpty()
  type: VehicleType;

  @IsString()
  @IsNotEmpty()
  brand: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsString()
  @IsOptional()
  variant?: string;

  @IsNumber()
  @IsNotEmpty()
  year: number;

  @IsString()
  @IsNotEmpty()
  registration_number: string;

  @IsString()
  @IsNotEmpty()
  chassis_number: string;

  @IsString()
  @IsNotEmpty()
  engine_number: string;

  @IsString()
  @IsNotEmpty()
  color: string;

  @IsNumber()
  @IsNotEmpty()
  mileage: number;

  @IsEnum(FuelType)
  @IsNotEmpty()
  fuel_type: FuelType;

  @IsEnum(TransmissionType)
  @IsNotEmpty()
  transmission: TransmissionType;

  @IsNumber()
  @IsOptional()
  engine_capacity?: number;

  @IsEnum(OwnershipType)
  @IsNotEmpty()
  ownership: OwnershipType;

  @IsDateString()
  @IsNotEmpty()
  insurance_valid_till: Date;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsNumber()
  @IsOptional()
  buying_price?: number;

  @IsNumber()
  @IsOptional()
  selling_price?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  vehicle_image_urls?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  vehicle_doc_urls?: string[];

  @IsEnum(BikeStatus)
  @IsNotEmpty()
  status: BikeStatus;

  @IsDateString()
  @IsNotEmpty()
  buying_date: Date;

  @IsDateString()
  @IsOptional()
  selling_date?: Date;
}

export class UpdateVehicleDto {
  @IsString()
  @IsOptional()
  customer_id?: string;

  @IsEnum(VehicleType)
  @IsOptional()
  type?: VehicleType;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsNumber()
  @IsOptional()
  year?: number;

  @IsString()
  @IsOptional()
  registration_number?: string;

  @IsString()
  @IsOptional()
  chassis_number?: string;

  @IsString()
  @IsOptional()
  engine_number?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsNumber()
  @IsOptional()
  mileage?: number;

  @IsEnum(FuelType)
  @IsOptional()
  fuel_type?: FuelType;

  @IsEnum(TransmissionType)
  @IsOptional()
  transmission?: TransmissionType;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsNumber()
  @IsOptional()
  buying_price?: number;

  @IsNumber()
  @IsOptional()
  selling_price?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  vehicle_image_urls?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  vehicle_doc_urls?: string[];

  @IsEnum(BikeStatus)
  @IsOptional()
  status?: BikeStatus;

  @IsDateString()
  @IsOptional()
  buying_date?: Date;

  @IsDateString()
  @IsOptional()
  selling_date?: Date;
}
