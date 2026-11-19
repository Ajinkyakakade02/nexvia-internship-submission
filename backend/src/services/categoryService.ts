import prisma from '../config/prisma.js';
import { ApiError } from '../utils/apiError.js';
import { serializePrisma } from '../utils/prismaSerializer.js';

const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

export const getCategories = async (includeInactive = false) => {
  const categories = await prisma.category.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { name: 'asc' }
  });
  return serializePrisma(categories);
};

export const getCategoryById = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id }
  });
  if (!category) {
    throw ApiError.notFound('Category not found');
  }
  return serializePrisma(category);
};

export const getCategoryBySlug = async (slug: string) => {
  const category = await prisma.category.findUnique({
    where: { slug }
  });
  if (!category) {
    throw ApiError.notFound('Category not found');
  }
  return serializePrisma(category);
};

export const createCategory = async (data: {
  name: string;
  description?: string;
  image?: string;
  isActive?: boolean;
}) => {
  const slug = slugify(data.name);

  const existing = await prisma.category.findFirst({
    where: { OR: [{ name: data.name }, { slug }] }
  });
  if (existing) {
    throw ApiError.conflict('A category with this name or slug already exists');
  }

  const category = await prisma.category.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      image: data.image,
      isActive: data.isActive !== undefined ? data.isActive : true
    }
  });
  return serializePrisma(category);
};

export const updateCategory = async (
  id: string,
  data: Partial<{ name: string; description: string; image: string; isActive: boolean }>
) => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    throw ApiError.notFound('Category not found');
  }

  let newSlug = category.slug;
  if (data.name && data.name !== category.name) {
    newSlug = slugify(data.name);
    const existing = await prisma.category.findFirst({
      where: {
        id: { not: id },
        OR: [{ name: data.name }, { slug: newSlug }]
      }
    });
    if (existing) {
      throw ApiError.conflict('A category with this name or slug already exists');
    }
  }

  const updated = await prisma.category.update({
    where: { id },
    data: {
      ...(data.name ? { name: data.name, slug: newSlug } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.image !== undefined ? { image: data.image } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {})
    }
  });
  return serializePrisma(updated);
};

export const deleteCategory = async (id: string) => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    throw ApiError.notFound('Category not found');
  }

  const productCount = await prisma.product.count({
    where: { categoryId: id, isDeleted: false }
  });
  if (productCount > 0) {
    throw ApiError.badRequest(
      `Cannot delete category with ${productCount} active product(s). Reassign products first.`
    );
  }

  await prisma.category.delete({ where: { id } });
  return { message: 'Category deleted successfully' };
};
