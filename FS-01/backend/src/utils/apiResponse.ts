import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { IApiResponse } from '../types/index.js';
import { serializePrisma } from './prismaSerializer.js';

export const success = <T>(
  res: Response,
  data?: T,
  message: string = 'Success',
  statusCode: number = StatusCodes.OK
): Response => {
  const transformedData = data !== undefined ? serializePrisma(data) : undefined;
  const responsePayload: IApiResponse<T> = {
    success: true,
    message,
    data: transformedData
  };
  return res.status(statusCode).json(responsePayload);
};

export const error = (
  res: Response,
  message: string = 'Error occurred',
  statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
  errors?: any
): Response => {
  const responsePayload: IApiResponse = {
    success: false,
    message,
    errors
  };
  return res.status(statusCode).json(responsePayload);
};

export default { success, error };
