import { Prisma, PrismaClient, SubscriptionPlanName, SubscriptionStatus } from '@prisma/client';
import { compare, hash } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { Service } from 'typedi';
import { SECRET_KEY } from '@config';
import { CreateUserDto, LoginAdminUserDto, LoginUserDto } from '@dtos/users.dto';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInOnboardTempToken, DataStoredInToken, DataStoredInUserToken, TokenData } from '@interfaces/auth.interface';
import { AdminRole, AdminUser, ShopUserResponseDTO, User, UserRole } from '@interfaces/users.interface';
import prisma from '@/database';
import { ulid } from 'ulid';
import { formatPrismaError } from '@/exceptions/prismaException';
import { onboardTempTokenCache } from '@/utils/onboardTempTokenCache';
import { OnboardShopDto } from '@/dtos/onboard.dto';
import { IShop, ShopType } from '@/interfaces/shop.interface';

@Service()
export class AuthService {
  private prisma = prisma;

  public async adminLogIn(adminUserData: LoginAdminUserDto): Promise<{ cookie: string; findAdminUser: AdminUser; token: string }> {
    try {
      const findAdminUser = await this.prisma.admin.findUnique({ where: { email: adminUserData.email } });
      if (!findAdminUser) throw new HttpException(409, `This email ${adminUserData.email} was not found`);

      const isPasswordMatching: boolean = await compare(adminUserData.password, findAdminUser.password);
      if (!isPasswordMatching) throw new HttpException(409, 'Password is not matching');

      // Generate session token
      const session_id = ulid();
      const tokenData = this.createToken({ ...findAdminUser, role: findAdminUser.role as AdminRole }, session_id);
      const cookie = this.createCookie(tokenData);

      // Create session entry
      await this.prisma.adminSession.create({
        data: {
          id: session_id,
          admin_id: findAdminUser.id,
          token: tokenData.token,
          device_info: adminUserData.device_info as any,
          expires_at: new Date(Date.now() + tokenData.expiresIn * 1000),
        },
      });

      delete findAdminUser.password;

      return { cookie, findAdminUser: { ...findAdminUser, role: findAdminUser.role as AdminRole }, token: tokenData.token };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw formatPrismaError(error);
      }
      throw new HttpException(500, `Error Admin Login: ${error.message}`);
    }
  }

  public async addAdminUser(adminUserData: AdminUser): Promise<AdminUser> {
    try {
      const findAdminUser = await this.prisma.admin.findUnique({ where: { email: adminUserData.email } });
      if (findAdminUser) throw new HttpException(409, `This email ${adminUserData.email} admin already exist`);

      const hashedPassword = await hash(adminUserData.password, 10);

      const admin = await this.prisma.admin.create({
        data: {
          id: ulid(),
          email: adminUserData.email,
          password: hashedPassword,
          name: adminUserData.name,
          role: adminUserData.role,
        },
        select: {
          id: true,
          email: true,
          password: true,
          name: true,
          role: true,
        },
      });

      return { ...admin, role: admin.role as AdminRole };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw formatPrismaError(error);
      }
      throw new HttpException(500, `Error Add New Admin: ${error.message}`);
    }
  }

  public async logout(token: string, session_id: string): Promise<void> {
    try {
      if (!token) throw new HttpException(401, 'No token provided');

      if (!session_id) throw new HttpException(401, 'Invalid token payload');

      const existingSession = await prisma.userSession.findUnique({
        where: { id: session_id },
      });

      await prisma.userSession.delete({
        where: { id: session_id },
      });
    } catch (error) {
      const statusCode = error instanceof HttpException ? error.status : 500;
      const message = error instanceof HttpException ? error.message : 'Unexpected logout error';

      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 23);

      console.error(`${timestamp} error: [POST] /api/v1/auth/logout >> StatusCode:: ${statusCode}, Message:: ${message}`);

      throw new HttpException(statusCode, message);
    }
  }

    public async loginUser(userData: LoginUserDto): Promise<{ cookie: string; findUser: User; token: string }> {
    try {
      const findUser = await this.prisma.user.findUnique({ where: { email: userData.email } });
      if (!findUser) throw new HttpException(409, `This email ${userData.email} was not found`);

      const isPasswordMatching: boolean = await compare(userData.password, findUser.password);
      if (!isPasswordMatching) throw new HttpException(409, 'Password is not matching');

      // Generate session token
      const session_id = ulid();
      const tokenData = this.createUserToken(findUser.shop_id, findUser.id, session_id);
      const cookie = this.createCookie(tokenData);

      // Create session entry
      await this.prisma.userSession.create({
        data: {
          id: session_id,
          user_id: findUser.id,
          token: tokenData.token,
          device_info: userData.device_info as any,
          expires_at: new Date(Date.now() + tokenData.expiresIn * 1000),
        },
      });

      delete  findUser.password;

      return { cookie, findUser: { ...findUser, role: findUser.role as UserRole}, token: tokenData.token };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw formatPrismaError(error);
      }
      throw new HttpException(500, `Error User Login: ${error.message}`);
    }
  }

  public async createTempUser(userData: CreateUserDto): Promise<{ cookie: string; token: string }> {
    try {
      const findUser = await this.prisma.user.findUnique({ where: { email: userData.email } });
      if (findUser) throw new HttpException(409, `This email ${findUser.email} was already registered`);

      const tokenData = this.createOnboardTempToken(userData.email);
      const cookie = this.createCookie(tokenData);

      const hashedPassword = await hash(userData.password, 10);

      await onboardTempTokenCache.setOnboardTempToken(userData.email, hashedPassword, tokenData.token, 'onboardTempToken');

      return { cookie, token: tokenData.token };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw formatPrismaError(error);
      }
      throw new HttpException(500, `Error Temp User Creation: ${error.message}`);
    }
  }

  public async onboardShop(
    onboardDetails: OnboardShopDto,
    email: string,
  ): Promise<{ shop: IShop; user: ShopUserResponseDTO; token: string; cookie: string }> {
    try {
      const existingShop = await this.prisma.shop.findUnique({
        where: { email: onboardDetails.email },
      });

      if (existingShop) {
        throw new HttpException(400, `Shop already exists with email: ${onboardDetails.email}`);
      }

      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new HttpException(400, `User already exists with email: ${email}`);
      }

      let shop: IShop;
      let user: ShopUserResponseDTO;
      let tokenData: { token: string; expiresIn: number };

      await this.prisma.$transaction(async tx => {
        // Create brand
        const createdShop = await tx.shop.create({
          data: {
            id: ulid(),
            email: onboardDetails.email,
            shop_name: onboardDetails.shop_name,
            phone: onboardDetails.phone,
            website_url: onboardDetails.website_url,
            address: onboardDetails.address,
            city: onboardDetails.city,
            state: onboardDetails.state,
            pincode: onboardDetails.pincode,
            owner_name: onboardDetails.owner_name,
            shop_type: ShopType.TWO_WHEELER,
            subscription_status: SubscriptionStatus.TRIAL,
            is_verified: false,
            is_active: true,
            is_deleted: false,
          },
        });
        shop = {
          ...createdShop,
          shop_type: ShopType[createdShop.shop_type as keyof typeof ShopType],
        } as IShop;

        // Create user
        const tempUser = await onboardTempTokenCache.getOnboardTempToken(email, 'onboardTempToken');
        if (!tempUser) throw new HttpException(400, 'Temporary user data not found. Please restart the onboarding process.');
        const createdUser = await tx.user.create({
          data: {
            id: ulid(),
            email,
            password: tempUser.password,
            role: UserRole.OWNER,
            shop_id: shop.id,
          },
          select: {
            id: true,
            email: true,
            role: true,
            shop_id: true,
            is_active: true,
            is_deleted: true,
          },
        });

        user = { ...createdUser, role: createdUser.role as unknown as UserRole };

        const session_id = ulid();

        tokenData = this.createUserToken(shop.id, user.id, session_id);

        await tx.userSession.create({
          data: {
            id: session_id,
            user_id: user.id,
            token: tokenData.token,
            device_info: onboardDetails.device_info as any,
            expires_at: new Date(Date.now() + tokenData.expiresIn * 1000),
            ip_address: onboardDetails.ip_address,
          },
        });
      });

      const cookie = this.createCookie(tokenData);

      await onboardTempTokenCache.deleteOnboardTempToken(email, 'onboardTempToken');

      return { shop, user, token: tokenData.token, cookie };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw formatPrismaError(error);
      }
      throw new HttpException(500, `Failed to onboard Shop: ${error.message}`);
    }
  }

  public createToken(adminUser: AdminUser, session_id: string): TokenData {
    const dataStoredInToken: DataStoredInToken = { id: adminUser.id, session_id: session_id };
    const secretKey: string = SECRET_KEY;
    const expiresIn: number = 60 * 60 * 24; // 1 day

    return { expiresIn, token: sign(dataStoredInToken, secretKey, { expiresIn }) };
  }

  public createUserToken(shop_id: string, user_id: string, session_id: string): TokenData {
    const dataStoredInToken: DataStoredInUserToken = { shop_id, user_id, session_id };
    const secretKey: string = SECRET_KEY;
    const expiresIn: number = 60 * 60 * 24; // 1 days

    return {
      expiresIn,
      token: sign(dataStoredInToken, secretKey, { expiresIn }),
    };
  }

  public createOnboardTempToken(email: string): TokenData {
    const dataStoredInToken: DataStoredInOnboardTempToken = { email: email };
    const secretKey: string = SECRET_KEY;
    const expiresIn: number = 60 * 60;

    return {
      expiresIn,
      token: sign(dataStoredInToken, secretKey, { expiresIn }),
    };
  }

  public createCookie(tokenData: TokenData): string {
    return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn};`;
  }
}
