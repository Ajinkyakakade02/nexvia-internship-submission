import axios from 'axios';
import api from './api';
import { ApiResponse } from '@/types';

export const uploadService = {
  async getUploadUrl(fileName: string, fileType: string): Promise<{ uploadUrl: string; fileUrl: string }> {
    const response = await api.post<ApiResponse<{ uploadUrl: string; fileUrl: string }>>('/upload/presigned-url', {
      fileName,
      fileType,
    });
    return response.data.data!;
  },

  async uploadToUrl(uploadUrl: string, file: File): Promise<void> {
    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
    });
  },

  async uploadFile(file: File): Promise<string> {
    try {
      const { uploadUrl, fileUrl } = await this.getUploadUrl(file.name, file.type);
      if (uploadUrl) {
        await this.uploadToUrl(uploadUrl, file);
        return fileUrl;
      }
    } catch {
      // Fallback: multipart direct upload if presigned url is not configured or in local/dev mode
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post<ApiResponse<{ url: string }>>('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data?.url || '';
    }
    return '';
  },
};
