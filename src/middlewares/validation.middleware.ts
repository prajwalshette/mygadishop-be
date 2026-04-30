import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodType } from 'zod';
import { HttpException } from '@/exceptions/HttpException';

/**
 * @name ValidationMiddleware
 * @description Validates request data using Zod schemas
 * @param schema Zod schema object
 * @param source Source of data to validate: 'body' | 'query' | 'params'
 */
export const ValidationMiddleware = (schema: ZodType, source: 'body' | 'query' | 'params' = 'body') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req[source]);
      if (source === 'body') {
        req.body = validated;
      } else {
        Object.defineProperty(req, source, {
          value: validated,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }
      next();
    } catch (error: any) {
      if (error instanceof ZodError || error.name === 'ZodError') {
        const message = error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ');
        next(new HttpException(400, message));
      } else {
        next(new HttpException(400, 'Validation failed'));
      }
    }
  };
};

/**
 * @name ValidateRequest
 * @description Validates multiple parts of the request (body, query, params)
 * @param schemas Object containing schemas for different parts of the request
 */
export const ValidateRequest = (schemas: { body?: ZodType; query?: ZodType; params?: ZodType }) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        Object.defineProperty(req, 'query', {
          value: await schemas.query.parseAsync(req.query),
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }
      if (schemas.params) {
        Object.defineProperty(req, 'params', {
          value: await schemas.params.parseAsync(req.params),
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }
      next();
    } catch (error: any) {
      if (error instanceof ZodError || error.name === 'ZodError') {
        const message = error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ');
        next(new HttpException(400, message));
      } else {
        next(new HttpException(400, 'Validation failed'));
      }
    }
  };
};
