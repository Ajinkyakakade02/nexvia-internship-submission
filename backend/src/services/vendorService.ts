import prisma from '../config/prisma.js';
import { OnboardingStatus, OrderStatus, UserRole } from '../types/index.js';
import { ApiError } from '../utils/apiError.js';
import { serializePrisma, toDecimal } from '../utils/prismaSerializer.js';

export const apply = async (
  userId: string,
  data: {
    businessName: string;
    businessDescription: string;
    businessEmail: string;
    businessPhone: string;
    businessAddress: any;
    gstNumber?: string;
  }
) => {
  let profile = await prisma.vendorProfile.findUnique({ where: { userId } });

  if (profile && profile.onboardingStatus === OnboardingStatus.APPROVED) {
    throw ApiError.badRequest('Vendor profile is already approved');
  }

  if (profile && profile.onboardingStatus === OnboardingStatus.PENDING) {
    throw ApiError.badRequest('A vendor onboarding application is already pending review');
  }

  if (!profile) {
    profile = await prisma.vendorProfile.create({
      data: {
        userId,
        businessName: data.businessName,
        businessDescription: data.businessDescription,
        businessEmail: data.businessEmail,
        businessPhone: data.businessPhone,
        businessAddress: data.businessAddress,
        gstNumber: data.gstNumber,
        onboardingStatus: OnboardingStatus.PENDING
      }
    });
  } else {
    profile = await prisma.vendorProfile.update({
      where: { userId },
      data: {
        businessName: data.businessName,
        businessDescription: data.businessDescription,
        businessEmail: data.businessEmail,
        businessPhone: data.businessPhone,
        businessAddress: data.businessAddress,
        gstNumber: data.gstNumber,
        onboardingStatus: OnboardingStatus.PENDING,
        adminNotes: null
      }
    });
  }

  // Update user role to VENDOR
  await prisma.user.update({
    where: { id: userId },
    data: { role: UserRole.VENDOR }
  });

  return serializePrisma(profile);
};

export const getProfile = async (userId: string) => {
  const profile = await prisma.vendorProfile.findUnique({
    where: { userId },
    include: { user: { select: { name: true, email: true, phone: true } } }
  });
  if (!profile) {
    throw ApiError.notFound('Vendor profile not found');
  }
  return serializePrisma(profile);
};

export const getStatus = async (userId: string) => {
  const profile = await prisma.vendorProfile.findUnique({ where: { userId } });
  if (!profile) {
    return { onboardingStatus: 'NOT_APPLIED' };
  }
  return {
    onboardingStatus: profile.onboardingStatus,
    adminNotes: profile.adminNotes,
    approvedAt: profile.approvedAt,
    rejectedAt: profile.rejectedAt
  };
};

export const getDashboard = async (userId: string) => {
  const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId } });
  const vendorId = vendorProfile ? vendorProfile.id : userId;

  const totalProducts = await prisma.product.count({
    where: { vendorId, isDeleted: false }
  });

  const vendorOrders = await prisma.vendorOrder.findMany({
    where: { vendorId },
    include: {
      order: {
        include: {
          customer: { select: { id: true, name: true, email: true } }
        }
      },
      items: true
    },
    orderBy: { createdAt: 'desc' }
  });

  const totalOrders = vendorOrders.length;
  const totalRevenue = vendorOrders.reduce((sum, vo) => sum + Number(vo.subtotal), 0);

  const commissions = await prisma.commission.findMany({
    where: { vendorId }
  });

  const totalCommission = commissions.reduce((sum, c) => sum + Number(c.commissionAmount), 0);
  const totalNet = commissions.reduce(
    (sum, c) => sum + Number(c.vendorNetAmount),
    totalRevenue - totalCommission
  );

  const recentOrders = vendorOrders.slice(0, 5).map((vo) => ({
    orderId: vo.orderId,
    orderNumber: vo.order.orderNumber,
    customer: vo.order.customer,
    items: vo.items,
    subtotal: Number(vo.subtotal),
    status: vo.status,
    createdAt: vo.createdAt
  }));

  return serializePrisma({
    totalProducts,
    totalOrders,
    totalRevenue,
    totalCommission,
    totalNet,
    recentOrders
  });
};

export const getOrders = async (
  userId: string,
  options: { page?: number; limit?: number; status?: string }
) => {
  const { page = 1, limit = 10, status } = options;
  const skip = (page - 1) * limit;

  const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId } });
  const vendorId = vendorProfile ? vendorProfile.id : userId;

  const where: any = { vendorId };
  if (status) {
    where.status = status as OrderStatus;
  }

  const [vendorOrders, total] = await Promise.all([
    prisma.vendorOrder.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          include: {
            customer: { select: { id: true, name: true, email: true, phone: true } }
          }
        },
        items: true
      }
    }),
    prisma.vendorOrder.count({ where })
  ]);

  const data = vendorOrders.map((vo) => ({
    _id: vo.order.id,
    id: vo.order.id,
    orderNumber: vo.order.orderNumber,
    createdAt: vo.order.createdAt,
    customer: vo.order.customer,
    shippingAddress: vo.order.shippingAddressSnapshot,
    suborder: {
      _id: vo.id,
      id: vo.id,
      vendor: vo.vendorId,
      items: vo.items,
      subtotal: Number(vo.subtotal),
      status: vo.status,
      trackingNumber: vo.trackingNumber
    },
    paymentStatus: vo.order.paymentStatus
  }));

  return serializePrisma({
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
};

export const updateOrderStatus = async (
  vendorId: string,
  orderId: string,
  newStatus: OrderStatus,
  comment?: string,
  trackingNumber?: string
) => {
  const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId: vendorId } });
  const resolvedVendorId = vendorProfile ? vendorProfile.id : vendorId;

  const suborder = await prisma.vendorOrder.findFirst({
    where: {
      orderId,
      vendorId: resolvedVendorId
    },
    include: { order: { include: { vendorOrders: true } } }
  });

  if (!suborder) {
    throw ApiError.forbidden('You are not authorized to update this order');
  }

  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PLACED]: [OrderStatus.PACKED, OrderStatus.CANCELLED],
    [OrderStatus.PACKED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
    [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.CANCELLED]: []
  };

  const allowed = validTransitions[suborder.status as OrderStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw ApiError.badRequest(
      `Invalid status transition from ${suborder.status} to ${newStatus}`
    );
  }

  return await prisma.$transaction(async (tx) => {
    const updatedSuborder = await tx.vendorOrder.update({
      where: { id: suborder.id },
      data: {
        status: newStatus,
        ...(trackingNumber ? { trackingNumber } : {})
      }
    });

    await tx.vendorOrderStatusHistory.create({
      data: {
        vendorOrderId: suborder.id,
        status: newStatus,
        changedBy: `Vendor (${vendorId})`,
        comment: comment || `Status updated to ${newStatus}`
      }
    });

    // Recalculate overall master order status
    const allSuborders = await tx.vendorOrder.findMany({ where: { orderId } });
    const allDelivered = allSuborders.every((vo) => vo.status === OrderStatus.DELIVERED);
    const someShipped = allSuborders.some((vo) => vo.status === OrderStatus.SHIPPED);
    const somePacked = allSuborders.some((vo) => vo.status === OrderStatus.PACKED);

    let overallStatus = suborder.order.overallStatus;
    if (allDelivered) {
      overallStatus = OrderStatus.DELIVERED;
    } else if (someShipped) {
      overallStatus = OrderStatus.SHIPPED;
    } else if (somePacked) {
      overallStatus = OrderStatus.PACKED;
    }

    if (overallStatus !== suborder.order.overallStatus) {
      await tx.order.update({
        where: { id: orderId },
        data: { overallStatus }
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: overallStatus,
          changedBy: `System (Vendor order status update)`,
          comment: `Master order transitioned to ${overallStatus}`
        }
      });
    }

    return serializePrisma(updatedSuborder);
  });
};
