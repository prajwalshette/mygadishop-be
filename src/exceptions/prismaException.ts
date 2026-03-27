import { Prisma } from '@prisma/client';
import { HttpException } from './HttpException';
import { logger } from '@/utils/logger';

export function formatPrismaError(error: unknown): HttpException {
  logger.error(error);
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const e = error as Prisma.PrismaClientKnownRequestError;
    switch (e.code) {
      case 'P2000':
        return new HttpException(400, 'The provided value is too long for the column.');
      case 'P2001':
        return new HttpException(404, 'The record was not found for the given filter.');
      case 'P2002':
        return new HttpException(409, 'Duplicate entry: a unique constraint would be violated.');
      case 'P2003':
        return new HttpException(409, 'Foreign key constraint failed on the field.');
      case 'P2004':
        return new HttpException(400, 'A constraint failed on the database.');
      case 'P2005':
        return new HttpException(400, 'Invalid value stored for the field.');
      case 'P2006':
        return new HttpException(400, 'The requested field does not exist in the database.');
      case 'P2007':
        return new HttpException(400, 'Data validation error.');
      case 'P2008':
        return new HttpException(500, 'Failed to parse the query.');
      case 'P2009':
        return new HttpException(500, 'Query validation failed.');
      case 'P2010':
        return new HttpException(500, 'Raw query failed.');
      case 'P2011':
        return new HttpException(400, 'Null constraint violation.');
      case 'P2012':
        return new HttpException(400, 'Missing required field.');
      case 'P2013':
        return new HttpException(400, 'Missing required argument.');
      case 'P2014':
        return new HttpException(409, 'Relation violation: the change would violate a relation.');
      case 'P2015':
        return new HttpException(404, 'Record not found.');
      case 'P2016':
        return new HttpException(400, 'Query interpretation error.');
      case 'P2017':
        return new HttpException(400, 'Multiple records found when only one was expected.');
      case 'P2018':
        return new HttpException(400, 'Path does not exist.');
      case 'P2019':
        return new HttpException(400, 'Input error: input value is invalid.');
      case 'P2020':
        return new HttpException(400, 'Value out of range for the type.');
      case 'P2021':
        return new HttpException(400, 'Table does not exist in the database.');
      case 'P2022':
        return new HttpException(400, 'Column does not exist in the table.');
      case 'P2023':
        return new HttpException(400, 'Inconsistent database state.');
      case 'P2024':
        return new HttpException(503, 'Database is temporarily unavailable.');
      case 'P2025':
        return new HttpException(404, 'Record not found for update/delete.');
      case 'P2026':
        return new HttpException(500, 'Operation failed due to server error.');
      case 'P2027':
        return new HttpException(500, 'Transaction could not be completed.');
      case 'P2028':
        return new HttpException(500, 'Timeout occurred during database operation.');
      default:
        return new HttpException(500, `Prisma error: ${e.message}`);
    }
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    const e = error as Prisma.PrismaClientUnknownRequestError;
    return new HttpException(500, `Unknown database error occurred: ${e.message}`);
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return new HttpException(500, 'The database engine panicked. Please report this error.');
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new HttpException(500, 'Failed to initialize Prisma client.');
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new HttpException(400, 'Validation error: check input values.');
  }

  return new HttpException(500, 'Unexpected error occurred.');
}
