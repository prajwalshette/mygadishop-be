import { Router } from 'express';
import { UserController } from '@/controllers/user.controller';
import { Routes } from '@interfaces/routes.interface';
import { AuthMiddleware } from '@middlewares/auth.middleware';
import { ValidationMiddleware } from '@middlewares/validation.middleware';
import {
  createUserSchema,
  updateUserSchema,
  updateUserPasswordSchema,
  userIdParamSchema,
  getAllUsersQuerySchema,
} from '@/schemas/user.schema';

export class UserRoute implements Routes {
  public path = '/user';
  public router: Router = Router();
  public userController = new UserController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Create user (only OWNER)
    this.router.post(
      `${this.path}`,
      [AuthMiddleware, ValidationMiddleware(createUserSchema, 'body')],
      this.userController.createUser
    );

    // Get all users
    this.router.get(
      `${this.path}`,
      [AuthMiddleware, ValidationMiddleware(getAllUsersQuerySchema, 'query')],
      this.userController.getAllUsers
    );

    // Get user by ID
    this.router.get(
      `${this.path}/:id`,
      [AuthMiddleware, ValidationMiddleware(userIdParamSchema, 'params')],
      this.userController.getUserById
    );

    // Update user (only OWNER)
    this.router.put(
      `${this.path}/:id`,
      [AuthMiddleware, ValidationMiddleware(userIdParamSchema, 'params'), ValidationMiddleware(updateUserSchema, 'body')],
      this.userController.updateUser
    );

    // Update user password (only OWNER)
    this.router.put(
      `${this.path}/:id/password`,
      [AuthMiddleware, ValidationMiddleware(userIdParamSchema, 'params'), ValidationMiddleware(updateUserPasswordSchema, 'body')],
      this.userController.updateUserPassword
    );

    // Delete user (only OWNER)
    this.router.delete(
      `${this.path}/:id`,
      [AuthMiddleware, ValidationMiddleware(userIdParamSchema, 'params')],
      this.userController.deleteUser
    );
  }
}

