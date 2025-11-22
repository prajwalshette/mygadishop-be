import { NextFunction, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { SECRET_KEY } from '@config';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken, DataStoredInUserToken, RequestWithUser } from '@interfaces/auth.interface';
import { UserRole } from '@/interfaces/users.interface';
import prisma from '@/database';

const getAuthorization = req => {
  const coockie = req.cookies['Authorization'];
  if (coockie) return coockie;

  const header = req.header('Authorization');
  if (header) return header.split('Bearer ')[1];

  return null;
};

export const AuthMiddleware = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const Authorization = getAuthorization(req);

    if (Authorization) {
      const { shop_id, user_id, session_id } = verify(Authorization, SECRET_KEY) as DataStoredInUserToken;
      const findUser = await prisma.user.findUnique({ where: { id: user_id } });
      const session = await prisma.userSession.findUnique({ where: { id: session_id } });

      if (findUser && session) {
        req.user = { ...findUser, role: findUser.role as UserRole };
        req.session_id = session_id;
        req.shop_id = shop_id;
        next();
      } else {
        next(new HttpException(401, 'Wrong authentication token'));
      }
    } else {
      next(new HttpException(404, 'Authentication token missing'));
    }
  } catch (error) {
    next(new HttpException(401, 'Wrong authentication token'));
  }
};
