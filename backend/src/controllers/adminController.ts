import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as analyticsService from '../services/analyticsService.js';
import * as commissionService from '../services/commissionService.js';
import * as orderService from '../services/orderService.js';
import prisma from '../config/prisma.js';
import { OnboardingStatus, UserRole } from '../types/index.js';
import { success } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { serializePrisma } from '../utils/prismaSerializer.js';

export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await analyticsService.getAdminDashboardStats();
  return success(res, stats, 'Admin dashboard statistics retrieved', StatusCodes.OK);
});

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const role = req.query.role as string;
  const search = req.query.search as string;

  const where: any = {};
  if (role) where.role = role as UserRole;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ];
  }

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.user.count({ where })
  ]);

  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'Users retrieved',
    data: serializePrisma(users),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
  });
});

export const getVendors = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;

  const where: any = {};
  if (status) where.onboardingStatus = status as OnboardingStatus;

  const skip = (page - 1) * limit;
  const [vendors, total] = await Promise.all([
    prisma.vendorProfile.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.vendorProfile.count({ where })
  ]);

  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'Vendors retrieved',
    data: serializePrisma(vendors),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
  });
});

export const approveVendor = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { adminNotes, razorpayLinkedAccountId } = req.body;

  const vendor = await prisma.vendorProfile.findUnique({ where: { id } });
  if (!vendor) {
    throw ApiError.notFound('Vendor profile not found');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedVendor = await tx.vendorProfile.update({
      where: { id },
      data: {
        onboardingStatus: OnboardingStatus.APPROVED,
        approvedAt: new Date(),
        ...(adminNotes ? { adminNotes } : {}),
        ...(razorpayLinkedAccountId ? { razorpayLinkedAccountId } : {})
      }
    });

    await tx.user.update({
      where: { id: vendor.userId },
      data: { role: UserRole.VENDOR }
    });

    return updatedVendor;
  });

  return success(res, serializePrisma(updated), 'Vendor approved successfully', StatusCodes.OK);
});

export const rejectVendor = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { adminNotes } = req.body;

  const vendor = await prisma.vendorProfile.findUnique({ where: { id } });
  if (!vendor) {
    throw ApiError.notFound('Vendor profile not found');
  }

  const updated = await prisma.vendorProfile.update({
    where: { id },
    data: {
      onboardingStatus: OnboardingStatus.REJECTED,
      rejectedAt: new Date(),
      ...(adminNotes ? { adminNotes } : {})
    }
  });

  return success(res, serializePrisma(updated), 'Vendor application rejected', StatusCodes.OK);
});

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: { isDeleted: false },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        vendor: { select: { id: true, businessName: true, businessEmail: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.product.count({ where: { isDeleted: false } })
  ]);

  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'Admin products retrieved',
    data: serializePrisma(products),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
  });
});

export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;
  const paymentStatus = req.query.paymentStatus as string;
  const search = req.query.search as string;

  const result = await orderService.adminGetAllOrders({
    page,
    limit,
    status,
    paymentStatus,
    search
  });

  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'Admin orders retrieved',
    data: result.data,
    pagination: result.pagination
  });
});

export const getPayments = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            customer: { select: { id: true, name: true, email: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.payment.count()
  ]);

  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'Payments retrieved',
    data: serializePrisma(payments),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
  });
});

export const getCommissions = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const result = await commissionService.getAdminCommissions({ page, limit });
  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'Commissions retrieved',
    data: result.data,
    summary: result.summary,
    pagination: result.pagination
  });
});

export const getAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await analyticsService.getAdminDashboardStats();
  return success(res, stats, 'Platform analytics retrieved', StatusCodes.OK);
});

export const updateCommissionSettings = asyncHandler(async (req: Request, res: Response) => {
  const { commissionPercent } = req.body;
  const updatedRate = commissionService.setPlatformCommissionRate(commissionPercent);
  return success(
    res,
    { commissionPercent: updatedRate },
    'Platform commission percentage updated',
    StatusCodes.OK
  );
});

export const reindexSearch = asyncHandler(async (_req: Request, res: Response) => {
  const searchService = await import('../services/searchService.js');
  await searchService.reindexAll();
  return success(res, null, 'Elasticsearch search index rebuild initiated', StatusCodes.OK);
});
