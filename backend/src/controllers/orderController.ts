import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as orderService from '../services/orderService.js';
import { generateInvoicePDF } from '../services/invoiceService.js';
import { success } from '../utils/apiResponse.js';

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { shippingAddressId, shippingAddressIndex, shippingAddress, couponCode } = req.body;
  const order = await orderService.createOrder(
    req.user!.userId,
    {
      shippingAddressId: shippingAddressId ?? shippingAddressIndex,
      shippingAddress
    },
    couponCode
  );
  return success(res, order, 'Order created successfully', StatusCodes.CREATED);
});

export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const result = await orderService.getCustomerOrders(req.user!.userId, { page, limit });
  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'Orders retrieved successfully',
    data: result.data,
    pagination: result.pagination
  });
});

export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.getOrderById(
    req.params.id,
    req.user!.userId,
    req.user!.role
  );
  return success(res, order, 'Order details retrieved', StatusCodes.OK);
});

export const getOrderTracking = asyncHandler(async (req: Request, res: Response) => {
  const tracking = await orderService.getOrderTracking(
    req.params.id,
    req.user!.userId,
    req.user!.role
  );
  return success(res, tracking, 'Order tracking details retrieved', StatusCodes.OK);
});

export const downloadInvoice = asyncHandler(async (req: Request, res: Response) => {
  const pdfBuffer = await generateInvoicePDF(
    req.params.id,
    req.user!.userId,
    req.user!.role
  );

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="invoice-${req.params.id}.pdf"`
  );
  return res.send(pdfBuffer);
});

