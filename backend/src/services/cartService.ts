import prisma from '../config/prisma.js';
import { getRedisClient } from '../config/redis.js';
import { ApiError } from '../utils/apiError.js';
import { ProductStatus } from '../types/index.js';
import { serializePrisma, toDecimal } from '../utils/prismaSerializer.js';

const CART_CACHE_TTL = 86400; // 24 hours in seconds

const getCartCacheKey = (customerId: string) => `cart:${customerId}`;

const syncCartToRedis = async (customerId: string, cartData: any) => {
  const redis = getRedisClient();
  if (!redis) return;
  try {
    await redis.setex(getCartCacheKey(customerId), CART_CACHE_TTL, JSON.stringify(cartData));
  } catch (err) {
    // Redis degradation: non-fatal
  }
};

const invalidateCartRedis = async (customerId: string) => {
  const redis = getRedisClient();
  if (!redis) return;
  try {
    await redis.del(getCartCacheKey(customerId));
  } catch (err) {
    // Non-fatal
  }
};

export const getCart = async (customerId: string) => {
  const redis = getRedisClient();
  if (redis) {
    try {
      const cached = await redis.get(getCartCacheKey(customerId));
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // Fallback
    }
  }

  let cart = await prisma.cart.findUnique({
    where: { customerId },
    include: {
      items: {
        include: {
          product: {
            include: { vendor: { select: { id: true, businessName: true } } }
          }
        }
      }
    }
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { customerId },
      include: {
        items: {
          include: {
            product: {
              include: { vendor: { select: { id: true, businessName: true } } }
            }
          }
        }
      }
    });
  }

  // Filter valid items
  const validItems = cart.items.filter(
    (item) => item.product && !item.product.isDeleted && item.product.status === ProductStatus.ACTIVE
  );

  if (validItems.length !== cart.items.length) {
    const validIds = validItems.map((i) => i.id);
    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        id: { notIn: validIds }
      }
    });
  }

  const subtotal = validItems.reduce((sum, item) => {
    const price = Number(item.product.price);
    return sum + price * item.quantity;
  }, 0);

  const formattedItems = validItems.map((item) => ({
    _id: item.id,
    id: item.id,
    product: {
      _id: item.product.id,
      id: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      price: Number(item.product.price),
      comparePrice: item.product.comparePrice ? Number(item.product.comparePrice) : null,
      images: item.product.images,
      stock: item.product.stock,
      status: item.product.status,
      vendor: {
        _id: item.product.vendor.id,
        id: item.product.vendor.id,
        name: item.product.vendor.businessName,
        businessName: item.product.vendor.businessName
      }
    },
    vendor: item.product.vendorId,
    quantity: item.quantity,
    priceAtAdd: Number(item.priceAtAdd)
  }));

  const result = {
    _id: cart.id,
    id: cart.id,
    customer: cart.customerId,
    items: formattedItems,
    itemCount: formattedItems.reduce((count, item) => count + item.quantity, 0),
    subtotal,
    updatedAt: cart.updatedAt
  };

  await syncCartToRedis(customerId, result);
  return result;
};

export const addToCart = async (customerId: string, productId: string, quantity = 1) => {
  if (quantity <= 0) {
    throw ApiError.badRequest('Quantity must be at least 1');
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, isDeleted: false },
    include: { vendor: true }
  });

  if (!product || product.status !== ProductStatus.ACTIVE) {
    throw ApiError.notFound('Product is unavailable or does not exist');
  }

  if (product.vendor.userId === customerId) {
    throw ApiError.badRequest('Vendors cannot purchase their own products');
  }

  if (product.stock < quantity) {
    throw ApiError.badRequest(`Insufficient stock available (in stock: ${product.stock})`);
  }

  await prisma.$transaction(async (tx) => {
    let cart = await tx.cart.findUnique({ where: { customerId } });
    if (!cart) {
      cart = await tx.cart.create({ data: { customerId } });
    }

    const existingItem = await tx.cartItem.findFirst({
      where: { cartId: cart.id, productId }
    });

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      if (newQty > product.stock) {
        throw ApiError.badRequest(`Cannot add more than available stock (${product.stock})`);
      }
      await tx.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQty,
          priceAtAdd: product.price
        }
      });
    } else {
      await tx.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          vendorId: product.vendorId,
          quantity,
          priceAtAdd: product.price
        }
      });
    }
  });

  await invalidateCartRedis(customerId);
  return getCart(customerId);
};

export const updateCartItem = async (customerId: string, productId: string, quantity: number) => {
  if (quantity <= 0) {
    return removeCartItem(customerId, productId);
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, isDeleted: false }
  });

  if (!product || product.status !== ProductStatus.ACTIVE) {
    throw ApiError.notFound('Product is unavailable or has been removed');
  }

  if (product.stock < quantity) {
    throw ApiError.badRequest(`Only ${product.stock} items currently available`);
  }

  const cart = await prisma.cart.findUnique({ where: { customerId } });
  if (!cart) {
    throw ApiError.notFound('Cart not found');
  }

  const item = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId }
  });

  if (!item) {
    throw ApiError.notFound('Item not in cart');
  }

  await prisma.cartItem.update({
    where: { id: item.id },
    data: {
      quantity,
      priceAtAdd: product.price
    }
  });

  await invalidateCartRedis(customerId);
  return getCart(customerId);
};

export const removeCartItem = async (customerId: string, productId: string) => {
  const cart = await prisma.cart.findUnique({ where: { customerId } });
  if (!cart) {
    throw ApiError.notFound('Cart not found');
  }

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id, productId }
  });

  await invalidateCartRedis(customerId);
  return getCart(customerId);
};

export const clearCart = async (customerId: string) => {
  const cart = await prisma.cart.findUnique({ where: { customerId } });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
  await invalidateCartRedis(customerId);
  return { message: 'Cart cleared successfully' };
};
