import { Prisma } from '@prisma/client';
import { Service } from 'typedi';
import { HttpException } from '@/exceptions/HttpException';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { ConflictException } from '@/exceptions/ConflictException';
import { BadRequestException } from '@/exceptions/BadRequestException';
import prisma from '@/database';
import { ulid } from 'ulid';
import { ShopUserRole } from '@/interfaces/users.interface';
import { CreateUserDto, UpdateUserDto, UpdateUserPasswordDto, GetAllUsersQueryDto } from '@/schemas/user.schema';
import { logger } from '@utils/logger';
import bcrypt from 'bcryptjs';

@Service()
export class UserService {
  private prisma = prisma;

  // -----------------------------
  // CREATE USER - Create a new shop user (only OWNER can create)
  // -----------------------------
  public async createUser(userData: CreateUserDto, shop_id: string, created_by_user_id: string): Promise<any> {
    try {
      // Verify shop exists
      const shop = await this.prisma.shop.findFirst({
        where: { id: shop_id, deleted_at: null, is_active: true },
      });

      if (!shop) {
        logger.warn(`Create user failed: Shop not found - ${shop_id}`);
        throw new NotFoundException('Shop not found');
      }

      // Check if email already exists
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [{ email: userData.email }, { phone: userData.phone || undefined }],
          deleted_at: null,
        },
      });

      if (existingUser) {
        logger.warn(`Create user failed: Email or phone already exists - ${userData.email}`);
        throw new ConflictException('User with this email or phone already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          id: ulid(),
          shop_id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          password: hashedPassword,
          role: userData.role || ShopUserRole.STAFF,
          is_active: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          is_active: true,
          created_at: true,
          updated_at: true,
        },
      });

      logger.info(`User created successfully: ${user.email} (${user.id}) by ${created_by_user_id}`);
      return {
        ...user,
        role: user.role as ShopUserRole,
      };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Create user error: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // GET ALL USERS - Get all users for a shop
  // -----------------------------
  public async getAllUsers(query: GetAllUsersQueryDto, shop_id: string): Promise<any> {
    try {
      const { page, limit, role, is_active, search } = query;
      const skip = (page - 1) * limit;

      const whereClause: Prisma.UserWhereInput = {
        shop_id,
        deleted_at: null,
      };

      if (role) {
        whereClause.role = role;
      }

      if (is_active !== undefined) {
        whereClause.is_active = is_active;
      }

      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where: whereClause,
          orderBy: { created_at: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            is_active: true,
            created_at: true,
            updated_at: true,
          },
        }),
        this.prisma.user.count({ where: whereClause }),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info(`Retrieved ${users.length} users for shop ${shop_id}`);
      return {
        users: users.map(user => ({
          ...user,
          role: user.role as ShopUserRole,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Get all users error for shop ${shop_id}: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // GET USER BY ID - Get a specific user
  // -----------------------------
  public async getUserById(user_id: string, shop_id: string): Promise<any> {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id: user_id,
          shop_id,
          deleted_at: null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          is_active: true,
          created_at: true,
          updated_at: true,
        },
      });

      if (!user) {
        logger.warn(`Get user failed: User not found - ${user_id}`);
        throw new NotFoundException('User not found');
      }

      logger.info(`User retrieved successfully: ${user_id}`);
      return {
        ...user,
        role: user.role as ShopUserRole,
      };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Get user error for ${user_id}: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // UPDATE USER - Update user details
  // -----------------------------
  public async updateUser(user_id: string, userData: UpdateUserDto, shop_id: string): Promise<any> {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id: user_id,
          shop_id,
          deleted_at: null,
        },
      });

      if (!user) {
        logger.warn(`Update user failed: User not found - ${user_id}`);
        throw new NotFoundException('User not found');
      }

      // Check if email or phone already exists (excluding current user)
      if (userData.email || userData.phone) {
        const existingUser = await this.prisma.user.findFirst({
          where: {
            AND: [
              { id: { not: user_id } },
              {
                OR: [userData.email ? { email: userData.email } : {}, userData.phone ? { phone: userData.phone } : {}],
              },
              { deleted_at: null },
            ],
          },
        });

        if (existingUser) {
          logger.warn(`Update user failed: Email or phone already exists`);
          throw new ConflictException('User with this email or phone already exists');
        }
      }

      const updateData: Prisma.UserUpdateInput = {};
      if (userData.name) updateData.name = userData.name;
      if (userData.email) updateData.email = userData.email;
      if (userData.phone !== undefined) updateData.phone = userData.phone;
      if (userData.role) updateData.role = userData.role;
      if (userData.is_active !== undefined) updateData.is_active = userData.is_active;

      const updatedUser = await this.prisma.user.update({
        where: { id: user_id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          is_active: true,
          created_at: true,
          updated_at: true,
        },
      });

      logger.info(`User updated successfully: ${user_id}`);
      return {
        ...updatedUser,
        role: updatedUser.role as ShopUserRole,
      };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Update user error for ${user_id}: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // UPDATE USER PASSWORD - Update user password
  // -----------------------------
  public async updateUserPassword(user_id: string, passwordData: UpdateUserPasswordDto, shop_id: string): Promise<void> {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id: user_id,
          shop_id,
          deleted_at: null,
        },
      });

      if (!user) {
        logger.warn(`Update user password failed: User not found - ${user_id}`);
        throw new NotFoundException('User not found');
      }

      const hashedPassword = await bcrypt.hash(passwordData.password, 10);

      await this.prisma.user.update({
        where: { id: user_id },
        data: { password: hashedPassword },
      });

      logger.info(`User password updated successfully: ${user_id}`);
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Update user password error for ${user_id}: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // DELETE USER - Soft delete a user
  // -----------------------------
  public async deleteUser(user_id: string, shop_id: string): Promise<void> {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id: user_id,
          shop_id,
          deleted_at: null,
        },
      });

      if (!user) {
        logger.warn(`Delete user failed: User not found - ${user_id}`);
        throw new NotFoundException('User not found');
      }

      // Don't allow deleting OWNER
      if (user.role === ShopUserRole.OWNER) {
        logger.warn(`Delete user failed: Cannot delete OWNER user - ${user_id}`);
        throw new BadRequestException('Cannot delete OWNER user');
      }

      await this.prisma.user.update({
        where: { id: user_id },
        data: { deleted_at: new Date() },
      });

      logger.info(`User deleted successfully: ${user_id}`);
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      logger.error(`Delete user error for ${user_id}: ${error.message}`);
      throw error;
    }
  }
}
