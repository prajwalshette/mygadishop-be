import { NextFunction, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { SECRET_KEY } from '@/config/env';
import { HttpException } from '@/exceptions/HttpException';
import type { DataStoredInUserToken, RequestWithUser } from '@modules/auth/auth.interface';
import type { UserRole } from '@modules/user/user.interface';
import prisma from '@/lib/prisma';
import { SessionCache } from '@/services/redis/cache/session.cache';

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

    if (!Authorization) {
      return next(new HttpException(401, 'Authentication token missing'));
    }

    // Verify JWT token
    const { shop_id, user_id, session_id } = verify(Authorization, SECRET_KEY) as DataStoredInUserToken;

    // Step 1: Try to get session data from Redis cache
    const cachedSession = await SessionCache.getSession(session_id);

    if (cachedSession) {
      // Cache hit - use cached data
      req.user = { ...cachedSession.user, role: cachedSession.user.role as UserRole };
      req.session_id = cachedSession.session_id;
      req.shop_id = cachedSession.shop_id;
      return next();
    }

    // Step 2: Cache miss - fetch from database
    const [findUser, session] = await Promise.all([
      prisma.user.findUnique({ where: { id: user_id } }),
      prisma.userSession.findUnique({ where: { id: session_id } }),
    ]);

    if (!findUser || !session) {
      return next(new HttpException(401, 'Wrong authentication token'));
    }

    // Step 3: Populate cache for future requests
    // Calculate remaining TTL from session expiry
    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    const remainingTTL = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);

    // Only cache if session hasn't expired and has reasonable TTL
    if (remainingTTL > 0) {
      // Exclude password from cache for security
      const { password, ...userWithoutPassword } = findUser;
      const userToCache = { ...userWithoutPassword, role: findUser.role as UserRole };
      await SessionCache.setSession(session_id, userToCache, shop_id, remainingTTL);
    }

    // Set request properties
    req.user = { ...findUser, role: findUser.role as UserRole };
    req.session_id = session_id;
    req.shop_id = shop_id;
    next();
  } catch (error) {
    next(new HttpException(401, 'Wrong authentication token'));
  }
};
