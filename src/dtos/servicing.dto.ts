import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { ServicingStatus } from '@/interfaces/servicing.interface';

export class CreateServicingDto {
  @IsString()
  @IsNotEmpty()
  public vehicle_id: string;

  @IsString()
  @IsNotEmpty()
  public customer_id: string;

  @IsDateString()
  @IsNotEmpty()
  public service_date: Date;

  @IsString()
  @IsNotEmpty()
  public service_type: string;

  @IsString()
  @IsOptional()
  public description?: string;

  @IsNumber()
  @IsNotEmpty()
  public cost: number;

  @IsEnum(ServicingStatus)
  @IsNotEmpty()
  public status: ServicingStatus;

  @IsDateString()
  @IsOptional()
  public next_service_date?: Date;
}

export class UpdateServicingDto {
  @IsString()
  @IsOptional()
  public vehicle_id?: string;

  @IsString()
  @IsOptional()
  public customer_id?: string;

  @IsDateString()
  @IsOptional()
  public service_date?: Date;

  @IsString()
  @IsOptional()
  public service_type?: string;

  @IsString()
  @IsOptional()
  public description?: string;

  @IsNumber()
  @IsOptional()
  public cost?: number;

  @IsEnum(ServicingStatus)
  @IsOptional()
  public status?: ServicingStatus;

  @IsDateString()
  @IsOptional()
  public next_service_date?: Date;
}
