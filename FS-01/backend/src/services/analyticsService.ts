import prisma from '../config/prisma.js';
import { OnboardingStatus, PaymentStatus, UserRole } from '../types/index.js';
import { serializePrisma } from '../utils/prismaSerializer.js';

export const getAdminDashboardStats = async () => {
  const [
    salesAgg,
    totalOrders,
    totalCustomers,
    totalVendors,
    pendingVendors,
    totalProducts,
    commissionAgg
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { paymentStatus: PaymentStatus.COMPLETED },
      _sum: { total: true }
    }),
    prisma.order.count(),
    prisma.user.count({ where: { role: UserRole.CUSTOMER } }),
    prisma.vendorProfile.count({ where: { onboardingStatus: OnboardingStatus.APPROVED } }),
    prisma.vendorProfile.count({ where: { onboardingStatus: OnboardingStatus.PENDING } }),
    prisma.product.count({ where: { isDeleted: false } }),
    prisma.commission.aggregate({
      _sum: { commissionAmount: true }
    })
  ]);

  const totalSales = salesAgg._sum.total ? Number(salesAgg._sum.total) : 0;
  const totalCommission = commissionAgg._sum.commissionAmount ? Number(commissionAgg._sum.commissionAmount) : 0;

  // Revenue by month (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const completedOrders = await prisma.order.findMany({
    where: {
      paymentStatus: PaymentStatus.COMPLETED,
      createdAt: { gte: sixMonthsAgo }
    },
    select: {
      createdAt: true,
      total: true
    },
    orderBy: { createdAt: 'asc' }
  });

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyMap = new Map<string, { name: string; revenue: number; orders: number }>();

  for (const ord of completedOrders) {
    const d = new Date(ord.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    const name = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    const existing = monthlyMap.get(key) || { name, revenue: 0, orders: 0 };
    existing.revenue += Number(ord.total);
    existing.orders += 1;
    monthlyMap.set(key, existing);
  }

  const formattedRevenue = Array.from(monthlyMap.values());

  // Top 5 selling products
  const topProducts = await prisma.product.findMany({
    where: { isDeleted: false },
    orderBy: { soldCount: 'desc' },
    take: 5,
    select: {
      id: true,
      name: true,
      price: true,
      soldCount: true,
      avgRating: true,
      images: true
    }
  });

  // Order status breakdown
  const orderStatusBreakdown = await prisma.order.groupBy({
    by: ['overallStatus'],
    _count: { id: true }
  });

  // Recent 10 transactions
  const recentTransactions = await prisma.payment.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          total: true,
          customer: { select: { id: true, name: true, email: true } }
        }
      }
    }
  });

  return serializePrisma({
    overview: {
      totalSales,
      totalOrders,
      totalCustomers,
      totalVendors,
      pendingVendors,
      totalProducts,
      totalCommission
    },
    revenueByMonth: formattedRevenue,
    topProducts,
    orderStatusBreakdown: orderStatusBreakdown.map((item) => ({
      status: item.overallStatus,
      count: item._count.id
    })),
    recentTransactions
  });
};
