import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { RequestWithAdmin, RequestWithOnboardTempUser } from '@/interfaces/auth.interface';
import { User, AdminUser } from '@interfaces/users.interface';
import { AuthService } from '@services/auth.service';
import { OnboardShopDto } from '@/dtos/onboard.dto';
import { LoginUserDto } from '@/dtos/users.dto';

export class AdminController {
  public auth = Container.get(AuthService);

  public adminLogIn = async (request: RequestWithAdmin, response: Response, next: NextFunction): Promise<void> => {
    try {
      const adminUserData: AdminUser = request.body;
      const { cookie, findAdminUser, token } = await this.auth.adminLogIn(adminUserData);

      response.setHeader('Set-Cookie', [cookie]);
      response.status(200).json({ data: { admin: findAdminUser, token: token }, message: 'login' });
    } catch (error) {
      next(error);
    }
  };

}