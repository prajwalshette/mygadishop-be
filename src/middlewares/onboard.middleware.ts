import { NextFunction, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { SECRET_KEY } from '@config';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInOnboardTempToken, RequestWithOnboardTempUser } from '@interfaces/auth.interface';
import { onboardTempTokenCache } from '@/utils/onboardTempTokenCache';

const getAuthorization = req => {
  const coockie = req.cookies['Authorization'];
  if (coockie) return coockie;

  const header = req.header('Authorization');
  if (header) return header.split('Bearer ')[1];

  return null;
};

export const OnboardAuthMiddleware = async (req: RequestWithOnboardTempUser, res: Response, next: NextFunction) => {
  try {
    const Authorization = getAuthorization(req);

    if (Authorization) {
      const { email } = (await verify(Authorization, SECRET_KEY)) as DataStoredInOnboardTempToken;
      const tokenData = await onboardTempTokenCache.getOnboardTempToken(email, 'onboardTempToken');
      if (tokenData && tokenData.token === Authorization && email === tokenData.email) {
        req.email = email;
        next();
      } else {
        next(new HttpException(401, 'Invalid or expired token'));
      }
    } else {
      next(new HttpException(401, 'Authentication token missing'));
    }
  } catch (error) {
    next(new HttpException(401, 'Wrong authentication token'));
  }
};
