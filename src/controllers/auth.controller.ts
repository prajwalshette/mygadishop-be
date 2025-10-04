import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { RequestWithAdmin } from '@/interfaces/auth.interface';
import { User, AdminUser} from '@interfaces/users.interface';
import { AuthService } from '@services/auth.service';

export class AuthController {
  public auth = Container.get(AuthService);

  public adminLogIn = async (request: RequestWithAdmin, response: Response, next: NextFunction): Promise<void> => {
    try {
      const adminUserData: AdminUser = request.body;
      const { cookie, findAdminUser, token} = await this.auth.adminLogIn(adminUserData);

      response.setHeader('Set-Cookie', [cookie]);
      response.status(200).json({ data: 
        { admin: findAdminUser, token: token}, message: 'login' });
    } catch (error) {
      next(error);
    }
  };

   public addAdminUser = async (request: RequestWithAdmin, response: Response, next: NextFunction): Promise<void> => {
    try {
      const adminUserData: AdminUser = request.body;
      const adminUser = await this.auth.addAdminUser(adminUserData);

      response.status(200).json({ data: adminUser, message: 'New Admin Add Sucessfully' });
    } catch (error) {
      next(error);
    }
  };

  public logOut = async (request: RequestWithAdmin, response: Response, next: NextFunction) => {
    try {
      const session_id = request.session_id;

      let token: string | undefined;

      // Fallback to header
      const headerToken = request.header('Authorization');
      if (!token && headerToken?.startsWith('Bearer ')) {
        token = headerToken.split('Bearer ')[1];
      }

      await this.auth.logout(token, session_id);

      response.setHeader('Set-Cookie', ['Authorization=; HttpOnly; Max-Age=0; Path=/']);

      return response.status(200).json({
        success: true,
        message: 'Logout successfully',
      });
    } catch (error) {
      next(error);
    }
  };

}
