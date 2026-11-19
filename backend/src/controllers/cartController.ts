import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as cartService from '../services/cartService.js';
import { success } from '../utils/apiResponse.js';

export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.getCart(req.user!.userId);
  return success(res, cart, 'Cart retrieved successfully', StatusCodes.OK);
});

export const addItem = asyncHandler(async (req: Request, res: Response) => {
  const { productId, quantity } = req.body;
  const cart = await cartService.addToCart(req.user!.userId, productId, quantity || 1);
  return success(res, cart, 'Item added to cart', StatusCodes.OK);
});

export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const { quantity } = req.body;
  const cart = await cartService.updateCartItem(req.user!.userId, productId, quantity);
  return success(res, cart, 'Cart updated successfully', StatusCodes.OK);
});

export const removeItem = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const cart = await cartService.removeCartItem(req.user!.userId, productId);
  return success(res, cart, 'Item removed from cart', StatusCodes.OK);
});

export const clear = asyncHandler(async (req: Request, res: Response) => {
  const result = await cartService.clearCart(req.user!.userId);
  return success(res, result, result.message, StatusCodes.OK);
});

