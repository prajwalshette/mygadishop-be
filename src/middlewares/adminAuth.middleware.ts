import { NextFunction, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { SECRET_KEY } from '@config';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken, RequestWithAdmin } from '@interfaces/auth.interface';
import { AdminRole } from '@/interfaces/users.interface';
import prisma from '@/database';
import { SessionCache } from '@/utils/sessionCache';

const getAuthorization = req => {
  const coockie = req.cookies['Authorization'];
  if (coockie) return coockie;

  const header = req.header('Authorization');
  if (header) return header.split('Bearer ')[1];

  return null;
};

export const AdminAuthMiddleware = async (req: RequestWithAdmin, res: Response, next: NextFunction) => {
  try {
    const Authorization = getAuthorization(req);

    if (!Authorization) {
      return next(new HttpException(401, 'Authentication token missing'));
    }

    // Verify JWT token
    const { id, session_id } = verify(Authorization, SECRET_KEY) as DataStoredInToken;

    // Step 1: Try to get session data from Redis cache
    const cachedSession = await SessionCache.getAdminSession(session_id);

    if (cachedSession) {
      // Cache hit - use cached data (password not cached for security)
      req.admin = {
        id: cachedSession.admin.id,
        email: cachedSession.admin.email,
        role: cachedSession.admin.role as AdminRole,
        password: '', // Password not cached for security
      };
      req.session_id = cachedSession.session_id;
      return next();
    }

    // Step 2: Cache miss - fetch from database
    const [findAdmin, session] = await Promise.all([
      prisma.admin.findUnique({ where: { id: id } }),
      prisma.adminSession.findUnique({ where: { id: session_id } }),
    ]);

    if (!findAdmin || !session) {
      return next(new HttpException(401, 'Wrong authentication token'));
    }

    // Step 3: Populate cache for future requests
    // Calculate remaining TTL from session expiry
    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    const remainingTTL = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);

    // Only cache if session hasn't expired and has reasonable TTL
    if (remainingTTL > 0) {
      const adminToCache = {
        id: findAdmin.id,
        email: findAdmin.email,
        role: findAdmin.role as AdminRole,
        // Password intentionally excluded from cache for security
      };
      await SessionCache.setAdminSession(session_id, adminToCache, remainingTTL);
    }

    // Set request properties
    req.admin = {
      id: findAdmin.id,
      email: findAdmin.email,
      role: findAdmin.role as AdminRole,
      password: findAdmin.password, // Password from DB, not cache
    };
    req.session_id = session_id;
    next();
  } catch (error) {
    next(new HttpException(401, 'Wrong authentication token'));
  }
};
