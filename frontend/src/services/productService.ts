import api from './api';
import { ApiResponse, PaginatedResponse, Product, ProductFilters, ProductFormData } from '@/types';

export const productService = {
  async getProducts(filters?: ProductFilters): Promise<PaginatedResponse<Product>> {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
      if (filters.rating !== undefined) params.append('rating', filters.rating.toString());
      if (filters.vendor) params.append('vendor', filters.vendor);
      if (filters.inStock) params.append('inStock', 'true');
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
    }
    const response = await api.get<ApiResponse<PaginatedResponse<Product>>>(`/products?${params.toString()}`);
    return response.data.data!;
  },

  async getProductById(id: string): Promise<Product> {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data.data!;
  },

  async getProductBySlug(slug: string): Promise<Product> {
    const response = await api.get<ApiResponse<Product>>(`/products/slug/${slug}`);
    return response.data.data!;
  },

  async createProduct(productData: ProductFormData): Promise<Product> {
    const payload = {
      ...productData,
      categoryId: (productData as any).categoryId || productData.category
    };
    const response = await api.post<ApiResponse<Product>>('/vendor/products', payload);
    return response.data.data!;
  },

  async updateProduct(id: string, productData: Partial<ProductFormData>): Promise<Product> {
    const payload = {
      ...productData,
      ...(productData.category ? { categoryId: productData.category } : {})
    };
    const response = await api.put<ApiResponse<Product>>(`/vendor/products/${id}`, payload);
    return response.data.data!;
  },

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/vendor/products/${id}`);
  },

  async getVendorProducts(params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<Product>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.status) searchParams.append('status', params.status);
    const response = await api.get<ApiResponse<PaginatedResponse<Product>>>(`/vendor/products?${searchParams.toString()}`);
    return response.data.data!;
  },

  async getFeaturedProducts(): Promise<Product[]> {
    const response = await api.get<ApiResponse<Product[]>>('/products/featured');
    return response.data.data || [];
  },

  async getTrendingProducts(): Promise<Product[]> {
    const response = await api.get<ApiResponse<Product[]>>('/products/trending');
    return response.data.data || [];
  },
};
