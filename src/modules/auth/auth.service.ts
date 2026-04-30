import { SubscriptionStatus } from '@prisma/client';
import { compare, hash } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { Service } from 'typedi';
import { SECRET_KEY, NODE_ENV } from '@/config/env';
import { BadRequestException, ConflictException, HttpException, NotFoundException, UnauthorizedException } from '@/exceptions';
import type { DataStoredInOnboardTempToken, DataStoredInToken, DataStoredInUserToken, TokenData } from './auth.interface';
import type { AdminRole, AdminUser, ShopUserResponseDTO, User, UserRole } from '@modules/user/user.interface';
import prisma from '@/lib/prisma';
import { ulid } from 'ulid';
import { generateUniqueShopSlug } from '@/utils/seo';
import { onboardTempTokenCache } from '@/services/redis/cache/ token.cache';
import { SessionCache } from '@/services/redis/cache/session.cache';
import type { IShop } from '@modules/shop/shop.interface';
import type { LoginDto } from './auth.validator';
import type { OnboardShopDto } from './auth.validator';
import type { AddAdminDto, AdminLoginDto } from '@modules/admin/admin.validator';
import { logger } from '@/utils/logger';
import { ShopUserRole } from '@prisma/client';

@Service()
export class AuthService {
  private prisma = prisma;

  // -----------------------------
  // ADMIN LOGIN - Authenticate admin user and create session
  // -----------------------------
  public async adminLogIn(adminUserData: AdminLoginDto): Promise<{ cookie: string; findAdminUser: AdminUser }> {
    try {
      const findAdminUser = await this.prisma.admin.findUnique({ where: { email: adminUserData.email } });

      if (!findAdminUser) {
        logger.warn(`Admin login failed: Email not found - ${adminUserData.email}`);
        throw new NotFoundException(`Admin with email ${adminUserData.email} was not found`);
      }

      const isPasswordMatching: boolean = await compare(adminUserData.password, findAdminUser.password);

      if (!isPasswordMatching) {
        logger.warn(`Admin login failed: Invalid password for email - ${adminUserData.email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

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

      logger.info(`Admin logged in successfully: ${adminUserData.email}`);
      return { cookie, findAdminUser: { ...findAdminUser, role: findAdminUser.role as AdminRole } };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      logger.error(`Admin login error for ${adminUserData.email}: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // ADD ADMIN USER - Create new admin user account
  // -----------------------------
  public async addAdminUser(adminUserData: AddAdminDto): Promise<AdminUser> {
    try {
      const findAdminUser = await this.prisma.admin.findUnique({ where: { email: adminUserData.email } });

      if (findAdminUser) {
        logger.warn(`Add admin failed: Email already exists - ${adminUserData.email}`);
        throw new ConflictException(`Admin with email ${adminUserData.email} already exists`);
      }

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

      logger.info(`Admin user created successfully: ${adminUserData.email}`);
      return { ...admin, role: admin.role as AdminRole };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      logger.error(`Add admin user error for ${adminUserData.email}: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // LOGOUT - Invalidate user session
  // -----------------------------
  public async logout(token: string, session_id: string): Promise<void> {
    try {
      if (!token) {
        logger.warn('Logout failed: No token provided');
        throw new UnauthorizedException('No token provided');
      }

      if (!session_id) {
        logger.warn('Logout failed: Invalid token payload');
        throw new UnauthorizedException('Invalid token payload');
      }

      const existingSession = await prisma.userSession.findUnique({
        where: { id: session_id },
      });

      // Delete session from database and clear Redis cache
      await Promise.all([prisma.userSession.delete({ where: { id: session_id } }), SessionCache.deleteSession(session_id)]);

      logger.info(`User logged out successfully: session ${session_id}`);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      logger.error(`Logout error for session ${session_id}: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // ADMIN LOGOUT - Invalidate admin session
  // -----------------------------
  public async adminLogout(token: string, session_id: string): Promise<void> {
    try {
      if (!token) {
        logger.warn('Admin logout failed: No token provided');
        throw new UnauthorizedException('No token provided');
      }

      if (!session_id) {
        logger.warn('Admin logout failed: Invalid token payload');
        throw new UnauthorizedException('Invalid token payload');
      }

      const existingSession = await prisma.adminSession.findUnique({
        where: { id: session_id },
      });

      if (!existingSession) {
        logger.warn(`Admin logout failed: Session not found - ${session_id}`);
        throw new NotFoundException('Session not found');
      }

      // Delete session from database and clear Redis cache
      await Promise.all([prisma.adminSession.delete({ where: { id: session_id } }), SessionCache.deleteSession(session_id, 'admin')]);

      logger.info(`Admin logged out successfully: session ${session_id}`);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      logger.error(`Admin logout error for session ${session_id}: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // UNIFIED LOGIN - Handles both existing users and new user creation
  // -----------------------------
  public async login(userData: LoginDto): Promise<{ cookie: string; newUser: boolean; user?: User }> {
    try {
      const findUser = await this.prisma.user.findUnique({ where: { email: userData.email } });

      // Case 1: User exists - Login
      if (findUser) {
        const isPasswordMatching: boolean = await compare(userData.password, findUser.password);

        if (!isPasswordMatching) {
          logger.warn(`User login failed: Invalid password for email - ${userData.email}`);
          throw new UnauthorizedException('Invalid credentials');
        }

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
            ip_address: userData.ip_address,
            expires_at: new Date(Date.now() + tokenData.expiresIn * 1000),
          },
        });

        delete findUser.password;

        logger.info(`User logged in successfully: ${userData.email}`);
        return {
          cookie,
          newUser: false,
          user: { ...findUser, role: findUser.role as UserRole },
        };
      }

      // Case 2: User doesn't exist - Create temp user for onboarding
      const tokenData = this.createOnboardTempToken(userData.email);
      const cookie = this.createCookie(tokenData);

      const hashedPassword = await hash(userData.password, 10);

      await onboardTempTokenCache.setOnboardTempToken(userData.email, hashedPassword, tokenData.token, 'onboardTempToken');

      logger.info(`New temp user created for onboarding: ${userData.email}`);
      return {
        cookie,
        newUser: true,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      logger.error(`Login error for ${userData.email}: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // ONBOARD SHOP - Complete shop onboarding and create user account
  // -----------------------------
  public async onboardShop(onboardDetails: OnboardShopDto, email: string): Promise<{ shop: IShop; user: ShopUserResponseDTO; cookie: string }> {
    try {
      const existingShop = await this.prisma.shop.findUnique({
        where: { email: onboardDetails.email },
      });

      if (existingShop) {
        logger.warn(`Shop onboarding failed: Shop email already exists - ${onboardDetails.email}`);
        throw new ConflictException(`Shop already exists with email: ${onboardDetails.email}`);
      }

      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        logger.warn(`Shop onboarding failed: User email already exists - ${email}`);
        throw new ConflictException(`User already exists with email: ${email}`);
      }

      let shop: IShop;
      let user: ShopUserResponseDTO;
      let tokenData: { token: string; expiresIn: number };

      await this.prisma.$transaction(async tx => {
        const slug = await generateUniqueShopSlug(
          { shop_name: onboardDetails.shop_name, city: onboardDetails.city },
          this.prisma,
        );

        // Create shop
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
            shop_business_type: onboardDetails.shop_business_type,
            slug,
            subscription_status: SubscriptionStatus.TRIAL,
            is_verified: false,
            is_active: true,
            deleted_at: null,
          },
        });
        shop = {
          ...createdShop,
        } as IShop;

        // Create user
        const tempUser = await onboardTempTokenCache.getOnboardTempToken(email, 'onboardTempToken');

        if (!tempUser) {
          logger.warn(`Shop onboarding failed: Temp user data not found for ${email}`);
          throw new BadRequestException('Temporary user data not found. Please restart the onboarding process.');
        }

        const createdUser = await tx.user.create({
          data: {
            id: ulid(),
            email,
            password: tempUser.password,
            role: ShopUserRole.OWNER,
            shop_id: shop.id,
          },
          select: {
            id: true,
            email: true,
            role: true,
            shop_id: true,
          },
        });

        user = {
          ...createdUser,
          role: createdUser.role as unknown as UserRole,
          is_active: true,
          deleted_at: null,
        };

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

      logger.info(`Shop onboarded successfully: ${onboardDetails.shop_name} (${email})`);
      return { shop, user, cookie };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      logger.error(`Shop onboarding error for ${email}: ${error.message}`);
      throw error;
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
    const isProduction = NODE_ENV === 'production';
    return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn}; Path=/; SameSite=${isProduction ? 'None' : 'Lax'}${
      isProduction ? '; Secure' : ''
    }`;
  }
}
