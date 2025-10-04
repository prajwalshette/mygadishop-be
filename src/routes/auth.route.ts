import { Router } from 'express';
import { AuthController } from '@controllers/auth.controller';
import { AddAdminUserDto, LoginAdminUserDto} from '@dtos/users.dto';
import { Routes } from '@interfaces/routes.interface';
import { AuthMiddleware } from '@middlewares/auth.middleware';
import { ValidationMiddleware } from '@middlewares/validation.middleware';

export class AuthRoute implements Routes {
  public path = '/auth';
  public router = Router();
  public auth = new AuthController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/admin-login`, ValidationMiddleware(LoginAdminUserDto), this.auth.adminLogIn);
    this.router.post(`${this.path}/add-admin-user`, [AuthMiddleware], ValidationMiddleware(AddAdminUserDto), this.auth.addAdminUser);
    this.router.post(`${this.path}/logout`, [AuthMiddleware], this.auth.logOut);
  }
}
