import prisma from '../config/prisma.js';
import { OrderStatus, UserRole } from '../types/index.js';
import { ApiError } from '../utils/apiError.js';
import { serializePrisma, toDecimal } from '../utils/prismaSerializer.js';

export const recalculateProductRating = async (productId: string) => {
  const stats = await prisma.review.aggregate({
    where: { productId, isApproved: true },
    _avg: { rating: true },
    _count: { rating: true }
  });

  const avgRating = stats._avg.rating ? Math.round(Number(stats._avg.rating) * 10) / 10 : 0;
  const ratingCount = stats._count.rating || 0;

  await prisma.product.update({
    where: { id: productId },
    data: {
      avgRating: toDecimal(avgRating),
      ratingCount
    }
  });

  return { avgRating, ratingCount };
};

export const createReview = async (
  customerId: string,
  data: {
    productId: string;
    rating: number;
    title?: string;
    comment: string;
  }
) => {
  const product = await prisma.product.findFirst({
    where: { id: data.productId, isDeleted: false }
  });
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  // One review per customer per product
  const existingReview = await prisma.review.findUnique({
    where: {
      customerId_productId: {
        customerId,
        productId: data.productId
      }
    }
  });

  if (existingReview) {
    throw ApiError.conflict('You have already submitted a review for this product');
  }

  // Check verified purchase (customer has delivered order containing product)
  const deliveredItem = await prisma.vendorOrderItem.findFirst({
    where: {
      productId: data.productId,
      vendorOrder: {
        order: {
          customerId,
          overallStatus: OrderStatus.DELIVERED
        }
      }
    },
    include: {
      vendorOrder: {
        select: { orderId: true }
      }
    }
  });

  const isVerifiedPurchase = !!deliveredItem;

  const review = await prisma.review.create({
    data: {
      customerId,
      productId: data.productId,
      orderId: deliveredItem?.vendorOrder?.orderId || null,
      rating: data.rating,
      title: data.title,
      comment: data.comment,
      isVerifiedPurchase,
      isApproved: true
    },
    include: {
      customer: { select: { id: true, name: true, avatar: true } }
    }
  });

  await recalculateProductRating(data.productId);

  return serializePrisma(review);
};

export const updateReview = async (
  customerId: string,
  reviewId: string,
  data: { rating?: number; title?: string; comment?: string }
) => {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) {
    throw ApiError.notFound('Review not found');
  }

  if (review.customerId !== customerId) {
    throw ApiError.forbidden('You can only update your own review');
  }

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: {
      ...(data.rating !== undefined ? { rating: data.rating } : {}),
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.comment !== undefined ? { comment: data.comment } : {})
    },
    include: {
      customer: { select: { id: true, name: true, avatar: true } }
    }
  });

  await recalculateProductRating(review.productId);

  return serializePrisma(updated);
};

export const deleteReview = async (userId: string, role: UserRole, reviewId: string) => {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) {
    throw ApiError.notFound('Review not found');
  }

  if (role !== UserRole.ADMIN && review.customerId !== userId) {
    throw ApiError.forbidden('You do not have permission to delete this review');
  }

  const productId = review.productId;
  await prisma.review.delete({ where: { id: reviewId } });
  await recalculateProductRating(productId);

  return { message: 'Review deleted successfully' };
};

export const getProductReviews = async (
  productId: string,
  params: { page?: number; limit?: number }
) => {
  const { page = 1, limit = 10 } = params;
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { productId, isApproved: true },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, avatar: true } }
      }
    }),
    prisma.review.count({ where: { productId, isApproved: true } })
  ]);

  return {
    data: serializePrisma(reviews),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};
