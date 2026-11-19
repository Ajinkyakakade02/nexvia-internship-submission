import { getElasticsearchClient } from '../config/elasticsearch.js';
import prisma from '../config/prisma.js';
import { ApiError } from '../utils/apiError.js';
import logger from '../utils/logger.js';

const INDEX_NAME = 'products';

export const createIndexIfNotExists = async () => {
  const es = getElasticsearchClient();
  if (!es) return;

  try {
    const exists = await es.indices.exists({ index: INDEX_NAME });
    if (!exists) {
      await es.indices.create({
        index: INDEX_NAME,
        body: {
          mappings: {
            properties: {
              name: { type: 'text', analyzer: 'standard' },
              description: { type: 'text', analyzer: 'standard' },
              category: { type: 'keyword' },
              vendor: { type: 'keyword' },
              vendorName: { type: 'keyword' },
              price: { type: 'float' },
              stock: { type: 'integer' },
              avgRating: { type: 'float' },
              status: { type: 'keyword' },
              createdAt: { type: 'date' }
            }
          }
        }
      });
      logger.info(`Elasticsearch index '${INDEX_NAME}' created`);
    }
  } catch (error: any) {
    logger.warn('Error creating Elasticsearch index:', error.message);
  }
};

export const indexProduct = async (product: any, vendorName?: string) => {
  const es = getElasticsearchClient();
  if (!es) return;

  const id = product.id || product._id?.toString();
  const categoryId = product.categoryId || product.category?.toString() || product.category?._id?.toString();
  const vendorId = product.vendorId || product.vendor?.toString() || product.vendor?._id?.toString();
  const numericPrice = typeof product.price === 'object' && product.price !== null ? Number(product.price) : Number(product.price);

  try {
    await es.index({
      index: INDEX_NAME,
      id,
      document: {
        name: product.name,
        description: product.description,
        category: categoryId,
        vendor: vendorId,
        vendorName: vendorName || product.vendor?.businessName || '',
        price: numericPrice,
        stock: product.stock,
        avgRating: product.avgRating || 0,
        status: product.status,
        createdAt: product.createdAt || new Date()
      }
    });
  } catch (error: any) {
    logger.warn(`Failed to index product ${id} to ES:`, error.message);
  }
};

export const removeProduct = async (productId: string) => {
  const es = getElasticsearchClient();
  if (!es) return;

  try {
    await es.delete({
      index: INDEX_NAME,
      id: productId
    });
  } catch (error: any) {
    logger.warn(`Failed to delete product ${productId} from ES:`, error.message);
  }
};

export const searchProducts = async (params: {
  query?: string;
  category?: string;
  vendor?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  status?: string;
  sort?: string;
  page?: number;
  limit?: number;
}) => {
  const es = getElasticsearchClient();
  if (!es) {
    throw new ApiError(503, 'Elasticsearch search service is currently offline or unreachable at port 9200');
  }

  const {
    query,
    category,
    vendor,
    minPrice,
    maxPrice,
    inStock,
    status = 'ACTIVE',
    sort = 'relevance',
    page = 1,
    limit = 10
  } = params;

  const must: any[] = [];
  const filter: any[] = [];

  if (query) {
    must.push({
      multi_match: {
        query,
        fields: ['name^3', 'description']
      }
    });
  } else {
    must.push({ match_all: {} });
  }

  if (category) filter.push({ term: { category } });
  if (vendor) filter.push({ term: { vendor } });
  if (status) filter.push({ term: { status } });
  if (inStock) filter.push({ range: { stock: { gt: 0 } } });

  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceRange: any = {};
    if (minPrice !== undefined) priceRange.gte = minPrice;
    if (maxPrice !== undefined) priceRange.lte = maxPrice;
    filter.push({ range: { price: priceRange } });
  }

  let sortCriteria: any = ['_score'];
  if (sort === 'price_asc') sortCriteria = [{ price: 'asc' }];
  else if (sort === 'price_desc') sortCriteria = [{ price: 'desc' }];
  else if (sort === 'date') sortCriteria = [{ createdAt: 'desc' }];
  else if (sort === 'rating') sortCriteria = [{ avgRating: 'desc' }];

  const from = (page - 1) * limit;

  try {
    const response = await es.search({
      index: INDEX_NAME,
      from,
      size: limit,
      body: {
        query: {
          bool: {
            must,
            filter
          }
        },
        sort: sortCriteria
      }
    });

    const hits = response.hits.hits;
    const total = typeof response.hits.total === 'number' ? response.hits.total : response.hits.total?.value || 0;

    return {
      productIds: hits.map((hit) => hit._id),
      hits: hits.map((hit) => ({
        id: hit._id,
        _id: hit._id,
        score: hit._score,
        source: hit._source
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error: any) {
    logger.error('Elasticsearch search execution failed:', error);
    if (error.name === 'ConnectionError' || error.message?.includes('connect') || error.code === 'ECONNREFUSED') {
      throw new ApiError(503, 'Elasticsearch search service is currently offline or unreachable at port 9200', error.message);
    }
    throw new ApiError(500, 'Search execution error', error.message);
  }
};

export const reindexAll = async () => {
  const es = getElasticsearchClient();
  if (!es) return;

  await createIndexIfNotExists();

  const products = await prisma.product.findMany({
    where: { isDeleted: false },
    include: { vendor: true }
  });
  for (const product of products) {
    await indexProduct(product, product.vendor?.businessName);
  }
  logger.info(`Re-indexed ${products.length} Prisma products to Elasticsearch`);
};

export default {
  createIndexIfNotExists,
  indexProduct,
  removeProduct,
  searchProducts,
  reindexAll
};
