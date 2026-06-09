import { NextFunction, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { SECRET_KEY } from '@/config/env';
import { HttpException } from '@/exceptions/HttpException';
import type { DataStoredInPublicUserToken, RequestWithPublicUser } from '@modules/auth/auth.interface';
import prisma from '@/lib/prisma';
import { PublicUserSessionCache } from '@/services/redis/cache/publicUserSession.cache';

const getPublicAuthorization = (req: RequestWithPublicUser): string | null => {
  const fromCookie = req.cookies?.['PublicAuthorization'];
  if (fromCookie) return fromCookie;

  const header = req.header('Authorization');
  if (header?.startsWith('Bearer ')) return header.slice('Bearer '.length);

  return null;
};

function isPublicUserTokenPayload(decoded: unknown): decoded is DataStoredInPublicUserToken {
  if (!decoded || typeof decoded !== 'object') return false;
  const o = decoded as Record<string, unknown>;
  return (
    typeof o.public_user_id === 'string' &&
    typeof o.session_id === 'string' &&
    o.user_id === undefined &&
    o.shop_id === undefined &&
    o.id === undefined &&
    o.email === undefined
  );
}

export const PublicUserAuthMiddleware = async (req: RequestWithPublicUser, _res: Response, next: NextFunction) => {
  try {
    const token = getPublicAuthorization(req);
    if (!token) {
      return next(new HttpException(401, 'Authentication token missing'));
    }

    const decoded = verify(token, SECRET_KEY);
    if (!isPublicUserTokenPayload(decoded)) {
      return next(new HttpException(401, 'Wrong authentication token'));
    }

    const { public_user_id, session_id } = decoded;

    const cached = await PublicUserSessionCache.getSession(session_id);
    if (!cached || cached.public_user_id !== public_user_id) {
      return next(new HttpException(401, 'Session expired or invalid'));
    }

    const publicUser = await prisma.publicUser.findFirst({
      where: { id: public_user_id, deleted_at: null },
      select: {
        id: true,
        email: true,
        phone: true,
        is_phone_verified: true,
        is_email_verified: true,
      },
    });

    if (!publicUser) {
      return next(new HttpException(401, 'Wrong authentication token'));
    }

    req.publicUser = publicUser;
    req.session_id = session_id;
    next();
  } catch {
    next(new HttpException(401, 'Wrong authentication token'));
  }
};
