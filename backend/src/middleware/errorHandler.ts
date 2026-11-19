import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../utils/apiError.js';
import { error as sendError } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import env from '../config/env.js';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = 'Internal Server Error';
  let errors: any = undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err instanceof ZodError) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = 'Validation failed';
    errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message
    }));
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = StatusCodes.CONFLICT;
      const target = (err.meta?.target as string[]) || [];
      message = target.length > 0
        ? `A record with this ${target.join(', ')} already exists`
        : 'Duplicate resource key';
    } else if (err.code === 'P2025') {
      statusCode = StatusCodes.NOT_FOUND;
      message = 'Requested record not found';
    } else {
      statusCode = StatusCodes.BAD_REQUEST;
      message = `Database error: ${err.message}`;
    }
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = StatusCodes.UNAUTHORIZED;
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = StatusCodes.UNAUTHORIZED;
    message = 'Authentication token expired';
  } else if (err instanceof Error) {
    message = err.message;
  }

  if (statusCode >= 500) {
    logger.error('Unhandled Server Error:', err);
  } else {
    logger.warn(`Handled Client Error [${statusCode}]: ${message}`, errors);
  }

  sendError(res, message, statusCode, errors);
};
