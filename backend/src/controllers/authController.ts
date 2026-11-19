import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as authService from '../services/authService.js';
import { success } from '../utils/apiResponse.js';
import { setTokenCookies, clearTokenCookies } from '../utils/generateToken.js';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  setTokenCookies(res, result.accessToken, result.refreshToken);
  return success(res, result, 'Registration successful', StatusCodes.CREATED);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  setTokenCookies(res, result.accessToken, result.refreshToken);
  return success(res, result, 'Login successful', StatusCodes.OK);
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  clearTokenCookies(res);
  return success(res, null, 'Logged out successfully', StatusCodes.OK);
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  const result = await authService.refresh(refreshToken);
  setTokenCookies(res, result.accessToken, result.refreshToken);
  return success(res, result, 'Token refreshed successfully', StatusCodes.OK);
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.userId);
  return success(res, user, 'Profile fetched successfully', StatusCodes.OK);
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.forgotPassword(req.body.email);
  return success(res, result, result.message, StatusCodes.OK);
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.resetPassword(req.body.token, req.body.password);
  return success(res, result, result.message, StatusCodes.OK);
});

