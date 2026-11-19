import prisma from '../config/prisma.js';
import { IAddress } from '../types/index.js';
import { ApiError } from '../utils/apiError.js';
import { serializePrisma } from '../utils/prismaSerializer.js';

export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      avatar: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      addresses: true,
      vendorProfile: true
    }
  });
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return serializePrisma(user);
};

export const updateProfile = async (
  userId: string,
  data: { name?: string; phone?: string; avatar?: string }
) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name ? { name: data.name } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.avatar !== undefined ? { avatar: data.avatar } : {})
    },
    include: { addresses: true }
  });
  return serializePrisma(user);
};

export const getAddresses = async (userId: string) => {
  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
  return serializePrisma(addresses);
};

export const addAddress = async (userId: string, addressData: IAddress) => {
  const existingCount = await prisma.address.count({ where: { userId } });
  const shouldBeDefault = addressData.isDefault || existingCount === 0;

  return await prisma.$transaction(async (tx) => {
    if (shouldBeDefault) {
      await tx.address.updateMany({
        where: { userId },
        data: { isDefault: false }
      });
    }

    await tx.address.create({
      data: {
        userId,
        fullName: addressData.fullName,
        phone: addressData.phone,
        street: addressData.street,
        city: addressData.city,
        state: addressData.state,
        postalCode: addressData.postalCode,
        country: addressData.country || 'India',
        isDefault: shouldBeDefault
      }
    });

    const updatedAddresses = await tx.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    return serializePrisma(updatedAddresses);
  });
};

export const updateAddress = async (
  userId: string,
  addressId: string,
  addressData: Partial<IAddress>
) => {
  const address = await prisma.address.findFirst({
    where: { id: addressId, userId }
  });
  if (!address) {
    throw ApiError.notFound('Address not found');
  }

  return await prisma.$transaction(async (tx) => {
    if (addressData.isDefault) {
      await tx.address.updateMany({
        where: { userId },
        data: { isDefault: false }
      });
    }

    await tx.address.update({
      where: { id: addressId },
      data: {
        ...(addressData.fullName ? { fullName: addressData.fullName } : {}),
        ...(addressData.phone ? { phone: addressData.phone } : {}),
        ...(addressData.street ? { street: addressData.street } : {}),
        ...(addressData.city ? { city: addressData.city } : {}),
        ...(addressData.state ? { state: addressData.state } : {}),
        ...(addressData.postalCode ? { postalCode: addressData.postalCode } : {}),
        ...(addressData.country ? { country: addressData.country } : {}),
        ...(addressData.isDefault !== undefined ? { isDefault: addressData.isDefault } : {})
      }
    });

    const updated = await tx.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    return serializePrisma(updated);
  });
};

export const deleteAddress = async (userId: string, addressId: string) => {
  const address = await prisma.address.findFirst({
    where: { id: addressId, userId }
  });
  if (!address) {
    throw ApiError.notFound('Address not found');
  }

  await prisma.address.delete({ where: { id: addressId } });
  const remaining = await prisma.address.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
  return serializePrisma(remaining);
};
