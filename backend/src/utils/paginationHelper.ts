import { IPaginatedResponse } from '../types/index.js';

export interface ParsedPagination {
  page: number;
  limit: number;
  skip: number;
  sort: string;
  order: 'asc' | 'desc';
}

export const parsePagination = (
  query: Record<string, any>,
  defaultLimit = 10,
  maxLimit = 100
): ParsedPagination => {
  const page = Math.max(1, parseInt(query.page as string, 10) || 1);
  let limit = parseInt(query.limit as string, 10) || defaultLimit;
  if (limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  const skip = (page - 1) * limit;
  const sort = (query.sort as string) || 'createdAt';
  const order = (query.order as string)?.toLowerCase() === 'asc' ? 'asc' : 'desc';

  return {
    page,
    limit,
    skip,
    sort,
    order
  };
};

export const formatPaginatedResponse = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): IPaginatedResponse<T> => {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages
    }
  };
};
