import { StatusCodes } from 'http-status-codes';

export class ApiError extends Error {
  public statusCode: number;
  public errors?: any;
  public isOperational: boolean;

  constructor(
    statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
    message: string = 'Internal Server Error',
    errors?: any,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg = 'Bad Request', errors?: any) {
    return new ApiError(StatusCodes.BAD_REQUEST, msg, errors);
  }

  static unauthorized(msg = 'Unauthorized', errors?: any) {
    return new ApiError(StatusCodes.UNAUTHORIZED, msg, errors);
  }

  static forbidden(msg = 'Forbidden', errors?: any) {
    return new ApiError(StatusCodes.FORBIDDEN, msg, errors);
  }

  static notFound(msg = 'Resource Not Found', errors?: any) {
    return new ApiError(StatusCodes.NOT_FOUND, msg, errors);
  }

  static conflict(msg = 'Conflict', errors?: any) {
    return new ApiError(StatusCodes.CONFLICT, msg, errors);
  }

  static internal(msg = 'Internal Server Error', errors?: any) {
    return new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, msg, errors);
  }
}
