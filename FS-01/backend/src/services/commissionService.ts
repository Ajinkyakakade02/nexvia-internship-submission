import prisma from '../config/prisma.js';
import env from '../config/env.js';
import { TransferStatus } from '../types/index.js';
import { ApiError } from '../utils/apiError.js';
import { getRazorpayInstance } from '../config/razorpay.js';
import logger from '../utils/logger.js';
import { serializePrisma, toDecimal } from '../utils/prismaSerializer.js';

let platformCommissionRate = env.PLATFORM_COMMISSION_PERCENT;

export const getPlatformCommissionRate = (): number => {
  return platformCommissionRate;
};

export const setPlatformCommissionRate = (rate: number): number => {
  if (rate < 0 || rate > 100) {
    throw ApiError.badRequest('Commission percentage must be between 0 and 100');
  }
  platformCommissionRate = rate;
  return platformCommissionRate;
};

export const calculateAndRecordCommissions = async (
  orderId: string,
  vendorOrders: any[],
  customRate?: number
) => {
  const rate = customRate !== undefined ? customRate : platformCommissionRate;
  const records: any[] = [];

  for (let i = 0; i < vendorOrders.length; i++) {
    const vo = vendorOrders[i];
    const grossAmount = Number(vo.subtotal);
    const commissionAmount = Math.round(((grossAmount * rate) / 100) * 100) / 100;
    const vendorNetAmount = Math.round((grossAmount - commissionAmount) * 100) / 100;

    // Duplicate protection: check if commission already recorded for this vendor order
    const existing = await prisma.commission.findUnique({
      where: { vendorOrderId: vo.id }
    });
    if (existing) {
      records.push(existing);
      continue;
    }

    const commissionDoc = await prisma.commission.create({
      data: {
        orderId,
        vendorOrderId: vo.id,
        vendorId: vo.vendorId,
        grossAmount: toDecimal(grossAmount),
        commissionPercent: toDecimal(rate),
        commissionAmount: toDecimal(commissionAmount),
        vendorNetAmount: toDecimal(vendorNetAmount),
        transferStatus: TransferStatus.SIMULATION
      }
    });

    records.push(commissionDoc);

    // Attempt live Razorpay Route transfer if credentials and vendor account are configured
    try {
      const razorpay = getRazorpayInstance();
      if (razorpay && env.PAYMENT_PROVIDER === 'razorpay') {
        const profile = await prisma.vendorProfile.findUnique({ where: { id: vo.vendorId } });
        if (profile?.razorpayLinkedAccountId) {
          const transfer = await (razorpay as any).transfers.create({
            account: profile.razorpayLinkedAccountId,
            amount: Math.round(vendorNetAmount * 100), // in paise
            currency: 'INR',
            notes: {
              orderId,
              vendorId: vo.vendorId
            }
          });

          await prisma.commission.update({
            where: { id: commissionDoc.id },
            data: {
              transferStatus: TransferStatus.COMPLETED,
              razorpayTransferId: transfer.id
            }
          });
        } else {
          logger.info(`Vendor (${vo.vendorId}) has no Razorpay Route linked account; tagged as SIMULATION`);
        }
      }
    } catch (err: any) {
      logger.warn(`Razorpay Route transfer note: ${err.message}`);
    }
  }

  return serializePrisma(records);
};

export const getVendorCommissions = async (
  vendorId: string,
  params: { page?: number; limit?: number }
) => {
  const { page = 1, limit = 10 } = params;
  const skip = (page - 1) * limit;

  const profile = await prisma.vendorProfile.findUnique({ where: { userId: vendorId } });
  const resolvedVendorId = profile ? profile.id : vendorId;

  const [commissions, total] = await Promise.all([
    prisma.commission.findMany({
      where: { vendorId: resolvedVendorId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        order: { select: { id: true, orderNumber: true, createdAt: true, paymentStatus: true } }
      }
    }),
    prisma.commission.count({ where: { vendorId: resolvedVendorId } })
  ]);

  return {
    data: serializePrisma(commissions),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getAdminCommissions = async (params: { page?: number; limit?: number }) => {
  const { page = 1, limit = 10 } = params;
  const skip = (page - 1) * limit;

  const [commissions, total, allComms] = await Promise.all([
    prisma.commission.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        order: { select: { id: true, orderNumber: true, createdAt: true, total: true } },
        vendor: { select: { id: true, businessName: true, businessEmail: true } }
      }
    }),
    prisma.commission.count(),
    prisma.commission.findMany({
      select: {
        grossAmount: true,
        commissionAmount: true,
        vendorNetAmount: true
      }
    })
  ]);

  const totalGross = allComms.reduce((sum, c) => sum + Number(c.grossAmount), 0);
  const totalCommission = allComms.reduce((sum, c) => sum + Number(c.commissionAmount), 0);
  const totalVendorNet = allComms.reduce((sum, c) => sum + Number(c.vendorNetAmount), 0);

  return {
    data: serializePrisma(commissions),
    summary: {
      totalGross: Math.round(totalGross * 100) / 100,
      totalCommission: Math.round(totalCommission * 100) / 100,
      totalVendorNet: Math.round(totalVendorNet * 100) / 100
    },
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};
