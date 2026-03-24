import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { UserService } from '@/services/user.service';
import { CreateUserDto, UpdateUserDto, UpdateUserPasswordDto, GetAllUsersQueryDto } from '@/validator/user.validator';
// Using UserRole from interface
import { UserRole } from '@/interfaces/users.interface';

export class UserController {
  public userService = Container.get(UserService);

  // Create user (only OWNER can create)
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

  // Get all users
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

  // Get user by ID
  public getUserById = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      const shop_id = request.shop_id;
      const user_id = request.params.id;

      const user = await this.userService.getUserById(user_id, shop_id);
      response.status(200).json({ data: user, message: 'User retrieved successfully' });
    } catch (error) {
      next(error);
    }
  };

  // Update user (only OWNER can update)
  public updateUser = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user is OWNER
      if (request.user.role !== UserRole.OWNER) {
        response.status(403).json({ message: 'Only shop owner can update users' });
        return;
      }

      const shop_id = request.shop_id;
      const user_id = request.params.id;
      const userData: UpdateUserDto = request.body;

      const user = await this.userService.updateUser(user_id, userData, shop_id);
      response.status(200).json({ data: user, message: 'User updated successfully' });
    } catch (error) {
      next(error);
    }
  };

  // Update user password (only OWNER can update)
  public updateUserPassword = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user is OWNER
      if (request.user.role !== UserRole.OWNER) {
        response.status(403).json({ message: 'Only shop owner can update user passwords' });
        return;
      }

      const shop_id = request.shop_id;
      const user_id = request.params.id;
      const passwordData: UpdateUserPasswordDto = request.body;

      await this.userService.updateUserPassword(user_id, passwordData, shop_id);
      response.status(200).json({ message: 'User password updated successfully' });
    } catch (error) {
      next(error);
    }
  };

  // Delete user (only OWNER can delete)
  public deleteUser = async (request: RequestWithUser, response: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user is OWNER
      if (request.user.role !== UserRole.OWNER) {
        response.status(403).json({ message: 'Only shop owner can delete users' });
        return;
      }

      const shop_id = request.shop_id;
      const user_id = request.params.id;

      await this.userService.deleteUser(user_id, shop_id);
      response.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      next(error);
    }
  };
}

