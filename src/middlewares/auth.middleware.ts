import { PrismaClient } from '@prisma/client';
import { NextFunction, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { SECRET_KEY } from '@config';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken, RequestWithAdmin, RequestWithUser } from '@interfaces/auth.interface';
import { AdminRole } from '@/interfaces/users.interface';
import prisma from '@/database';
import { AdminUser } from '@/interfaces/users.interface';

const getAuthorization = (req) => {
  const coockie = req.cookies['Authorization'];
  if (coockie) return coockie;

  const header = req.header('Authorization');
  if (header) return header.split('Bearer ')[1];

  return null;
}

export const AuthMiddleware = async (req: RequestWithAdmin, res: Response, next: NextFunction) => {
  try {
    const Authorization = getAuthorization(req);

    if (Authorization) {
      const { id, session_id} = (await verify(Authorization, SECRET_KEY)) as DataStoredInToken;
      const findAdmin = await prisma.admin.findUnique({ where: { id: id } });
      const session = await prisma.session.findUnique({ where: { id: session_id }});


      if (findAdmin && session) {
        req.admin = {
          id: findAdmin.id,
          email: findAdmin.email,
          role: findAdmin.role as AdminRole,
          password: findAdmin.password,
        };
        req.session_id = session_id
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
