import api from './api';
import { ApiResponse, AuthResponse, LoginFormData, RegisterFormData, User } from '@/types';

export const authService = {
  async login(credentials: LoginFormData): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    return response.data.data!;
  },

  async register(data: RegisterFormData): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data.data!;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  async refreshToken(): Promise<{ accessToken: string }> {
    const response = await api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh-token');
    return response.data.data!;
  },

  async getMe(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data.data!;
  },

  async forgotPassword(email: string): Promise<ApiResponse> {
    const response = await api.post<ApiResponse>('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(token: string, password: string): Promise<ApiResponse> {
    const response = await api.post<ApiResponse>(`/auth/reset-password/${token}`, { password });
    return response.data;
  },

  async updateProfile(profileData: Partial<User>): Promise<User> {
    const response = await api.put<ApiResponse<User>>('/auth/profile', profileData);
    return response.data.data!;
  },
};
