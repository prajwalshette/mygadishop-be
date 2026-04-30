import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import type { RequestWithUser } from '@modules/auth/auth.interface';
import type { CreateUserDto, GetAllUsersQueryDto, UpdateUserDto, UpdateUserPasswordDto } from './user.validator';
import { UserService } from './user.service';
// Using UserRole from interface
import { UserRole } from '@modules/user/user.interface';

export class UserController {
  public userService = Container.get(UserService);

  // -----------------------------
  // CREATE USER - Create user (OWNER only)
  // -----------------------------
  public createUser = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user is OWNER
      if (request.user.role !== UserRole.OWNER) {
        response.status(403).json({ message: 'Only shop owner can create users' });
        return;
      }

      const shop_id = request.shop_id;
      const user_id = request.user.id!;
      const userData: CreateUserDto = request.body;

      const user = await this.userService.createUser(userData, shop_id, user_id);
      response.status(201).json({ data: user, message: 'User created successfully' });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // GET ALL USERS - Retrieve users list
  // -----------------------------
  public getAllUsers = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const shop_id = request.shop_id;
      const query: GetAllUsersQueryDto = request.query as any;

      const result = await this.userService.getAllUsers(query, shop_id);
      response.status(200).json({ data: result, message: 'Users retrieved successfully' });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // GET USER BY ID - Retrieve single user by ID
  // -----------------------------
  public getUserById = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const shop_id = request.shop_id;
      const user_id = request.params.id as string;

      const user = await this.userService.getUserById(user_id, shop_id);
      response.status(200).json({ data: user, message: 'User retrieved successfully' });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // UPDATE USER - Modify existing user (OWNER only)
  // -----------------------------
  public updateUser = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user is OWNER
      if (request.user.role !== UserRole.OWNER) {
        response.status(403).json({ message: 'Only shop owner can update users' });
        return;
      }

      const shop_id = request.shop_id;
      const user_id = request.params.id as string;
      const userData: UpdateUserDto = request.body;

      const user = await this.userService.updateUser(user_id, userData, shop_id);
      response.status(200).json({ data: user, message: 'User updated successfully' });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // UPDATE USER PASSWORD - Update user password (OWNER only)
  // -----------------------------
  public updateUserPassword = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user is OWNER
      if (request.user.role !== UserRole.OWNER) {
        response.status(403).json({ message: 'Only shop owner can update user passwords' });
        return;
      }

      const shop_id = request.shop_id;
      const user_id = request.params.id as string;
      const passwordData: UpdateUserPasswordDto = request.body;

      await this.userService.updateUserPassword(user_id, passwordData, shop_id);
      response.status(200).json({ message: 'User password updated successfully' });
    } catch (error) {
      next(error);
    }
  };

  // -----------------------------
  // DELETE USER - Delete user (OWNER only)
  // -----------------------------
  public deleteUser = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user is OWNER
      if (request.user.role !== UserRole.OWNER) {
        response.status(403).json({ message: 'Only shop owner can delete users' });
        return;
      }

      const shop_id = request.shop_id;
      const user_id = request.params.id as string;

      await this.userService.deleteUser(user_id, shop_id);
      response.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      next(error);
    }
  };
}

