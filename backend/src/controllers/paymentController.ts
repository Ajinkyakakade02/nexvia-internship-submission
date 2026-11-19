import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as paymentService from '../services/paymentService.js';
import { success } from '../utils/apiResponse.js';

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { orderId, amount, currency } = req.body;
  const result = await paymentService.createRazorpayOrder(orderId, amount, currency);
  return success(res, result, 'Payment order initialized', StatusCodes.OK);
});

export const verify = asyncHandler(async (req: Request, res: Response) => {
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const result = await paymentService.verifyPayment(
    orderId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  );
  return success(res, result, result.message, StatusCodes.OK);
});

export const webhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const rawBody = (req as any).rawBody || Buffer.from(JSON.stringify(req.body));
  const result = await paymentService.handleWebhook(rawBody, signature);
  return success(res, result, 'Webhook processed', StatusCodes.OK);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const payment = await paymentService.getPaymentById(req.params.id);
  return success(res, payment, 'Payment details retrieved', StatusCodes.OK);
});

