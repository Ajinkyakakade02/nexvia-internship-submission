import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as vendorService from '../services/vendorService.js';
import { success } from '../utils/apiResponse.js';

export const apply = asyncHandler(async (req: Request, res: Response) => {
  const profile = await vendorService.apply(req.user!.userId, req.body);
  return success(res, profile, 'Vendor application submitted successfully', StatusCodes.CREATED);
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await vendorService.getProfile(req.user!.userId);
  return success(res, profile, 'Vendor profile fetched successfully', StatusCodes.OK);
});

export const getStatus = asyncHandler(async (req: Request, res: Response) => {
  const status = await vendorService.getStatus(req.user!.userId);
  return success(res, status, 'Vendor onboarding status retrieved', StatusCodes.OK);
});

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const dashboard = await vendorService.getDashboard(req.user!.userId);
  return success(res, dashboard, 'Vendor dashboard statistics retrieved', StatusCodes.OK);
});

export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;

  const result = await vendorService.getOrders(req.user!.userId, { page, limit, status });
  return success(res, result.data, 'Vendor orders retrieved', StatusCodes.OK);
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, comment, trackingNumber } = req.body;
  const suborder = await vendorService.updateOrderStatus(
    req.user!.userId,
    req.params.id,
    status,
    comment,
    trackingNumber
  );
  return success(res, suborder, 'Order status updated successfully', StatusCodes.OK);
});

