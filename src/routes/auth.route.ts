import { Router } from 'express';
import { AuthController } from '@controllers/auth.controller';
import { AddAdminUserDto, LoginAdminUserDto, CreateUserDto, LoginUserDto} from '@dtos/users.dto';
import { Routes } from '@interfaces/routes.interface';
import { AuthMiddleware } from '@middlewares/auth.middleware';
import { ValidationMiddleware } from '@middlewares/validation.middleware';
import { OnboardAuthMiddleware } from '@middlewares/onboard.middleware';
import { OnboardShopDto } from '@/dtos/onboard.dto';

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

    //Api For User Login and Signup 
    this.router.post(`${this.path}/login`, ValidationMiddleware(LoginUserDto), this.auth.loginUser);
    this.router.post(`${this.path}/signup`, ValidationMiddleware(CreateUserDto), this.auth.createTempUser);
    this.router.post(`${this.path}/shop-onboard`, [OnboardAuthMiddleware, ValidationMiddleware(OnboardShopDto)], this.auth.onboardShop);
  }
}
