import api from './api';
import { ApiResponse, Category } from '@/types';

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    const response = await api.get<ApiResponse<Category[]>>('/categories');
    return response.data.data || [];
  },

  async getCategoryBySlug(slug: string): Promise<Category> {
    const response = await api.get<ApiResponse<Category>>(`/categories/${slug}`);
    return response.data.data!;
  },

  async createCategory(categoryData: { name: string; description?: string; image?: string }): Promise<Category> {
    const response = await api.post<ApiResponse<Category>>('/admin/categories', categoryData);
    return response.data.data!;
  },

  async updateCategory(id: string, categoryData: Partial<{ name: string; description?: string; image?: string; isActive?: boolean }>): Promise<Category> {
    const response = await api.put<ApiResponse<Category>>(`/admin/categories/${id}`, categoryData);
    return response.data.data!;
  },

  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/admin/categories/${id}`);
  },
};
