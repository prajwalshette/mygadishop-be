import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, IsEnum, IsOptional, IsJSON, IsObject} from 'class-validator';
import { AdminRole } from '@/interfaces/users.interface';

export class CreateUserDto {
  @IsEmail()
  public email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(9)
  @MaxLength(32)
  public password: string;
}

export class LoginUserDto {
  @IsEmail()
  public email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(9)
  @MaxLength(32)
  public password: string;

   @IsObject() // <--- Change this from @IsJSON()
  @IsOptional()
  public device_info?: Record<string, any>; 

  @IsString()
  @IsOptional()
  public ip_address?: string;
}


export class UpdateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(9)
  @MaxLength(32)
  public password: string;
}

export class LoginAdminUserDto {
  @IsEmail()
  public email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(9)
  @MaxLength(32)
  public password: string;

  @IsOptional()
  public device_info?: Object;
}

export class AddAdminUserDto {
  @IsEmail()
  @IsNotEmpty()
  public email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(9)
  @MaxLength(32)
  public password: string;

  @IsString()
  @IsNotEmpty()
  public name: string;

  @IsEnum(AdminRole)
  @IsNotEmpty()
  public role: AdminRole
}



