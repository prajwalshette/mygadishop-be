import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { SubscriptionPlanName } from '@interfaces/subscription.interface';

export class CreateSubscriptionPlanDto {
  @IsEnum(SubscriptionPlanName)
  @IsNotEmpty()
  public plan_name: SubscriptionPlanName;

  @IsString()
  @IsNotEmpty()
  public description: string;

  @IsNotEmpty()
  public is_active: boolean;

  @IsNumber()
  @IsOptional()
  public max_vehicles?: number;

  @IsNumber()
  @IsNotEmpty()
  public max_staff_users: number;
}
