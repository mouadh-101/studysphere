import { apiClient } from './authService';
import type {
  Resource,
  Category,
  UploadResourceData,
  UpdateResourceData,
  ResourceResponse,
  ResourcesListResponse,
  CategoriesResponse,
  ResourceFilters,
} from './types/resource';


export const resourceService = {

  uploadResource: async (data: UploadResourceData): Promise<ResourceResponse> => {
    try {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('title', data.title);
      if (data.description) {
        formData.append('description', data.description);
      }
      formData.append('category', data.category);

      const response = await apiClient.post<ResourceResponse>(
        '/api/resources/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to upload resource');
      }
      throw new Error('An unexpected error occurred during upload');
    }
  },


  getResources: async (filters?: ResourceFilters): Promise<ResourcesListResponse> => {
    try {
      const params = new URLSearchParams();

      if (filters?.user_id) params.append('user_id', filters.user_id);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const queryString = params.toString();
      const url = queryString ? `/api/resources?${queryString}` : '/api/resources';

      const response = await apiClient.get<ResourcesListResponse>(url);

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to fetch resources');
      }
      throw new Error('An unexpected error occurred while fetching resources');
    }
  },

  getResourceById: async (resourceId: string): Promise<ResourceResponse> => {
    try {
      const response = await apiClient.get<ResourceResponse>(
        `/api/resources/resource/${resourceId}`
      );

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to fetch resource');
      }
      throw new Error('An unexpected error occurred while fetching resource');
    }
  },

  updateResource: async (
    resourceId: string,
    data: UpdateResourceData
  ): Promise<ResourceResponse> => {
    try {
      const response = await apiClient.put<ResourceResponse>(
        `/api/resources/resource/${resourceId}`,
        data
      );

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to update resource');
      }
      throw new Error('An unexpected error occurred while updating resource');
    }
  },

  deleteResource: async (resourceId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.delete<{ success: boolean; message: string }>(
        `/api/resources/resource/${resourceId}`
      );

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to delete resource');
      }
      throw new Error('An unexpected error occurred while deleting resource');
    }
  },

  downloadResource: async (resourceId: string, filename?: string): Promise<void> => {
    try {
      const response = await apiClient.get(`/api/resources/resource/${resourceId}/download`, {
        responseType: 'blob',
      });

      // Create blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename || 'download');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to download resource');
      }
      throw new Error('An unexpected error occurred while downloading resource');
    }
  },

  getCategories: async (): Promise<CategoriesResponse> => {
    try {
      const response = await apiClient.get<CategoriesResponse>('/api/resources/categories');

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to fetch categories');
      }
      throw new Error('An unexpected error occurred while fetching categories');
    }
  },


  getUserResources: async (
    userId: string,
    limit?: number,
    offset?: number
  ): Promise<ResourcesListResponse> => {
    return resourceService.getResources({ user_id: userId, limit, offset });
  },

  searchResources: async (
    searchTerm: string,
    limit?: number,
    offset?: number
  ): Promise<ResourcesListResponse> => {
    return resourceService.getResources({ search: searchTerm, limit, offset });
  },

  getResourcesByCategory: async (
    categoryName: string,
    limit?: number,
    offset?: number
  ): Promise<ResourcesListResponse> => {
    return resourceService.getResources({ category: categoryName, limit, offset });
  },

  getFullFileUrl: (fileUrl: string): string => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ;
    return `${baseUrl}${fileUrl}`;
  },

  validateFile: (file: File): { valid: boolean; error?: string } => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/jpg',
    ];

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size exceeds 50MB limit',
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Only PDF, Word, PowerPoint, Excel, text, and image files are allowed',
      };
    }

    return { valid: true };
  },


  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  },

  getFileExtension: (filename: string): string => {
    return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
  },

  getFileIcon: (filename: string): string => {
    const extension = resourceService.getFileExtension(filename).toLowerCase();

    const iconMap: Record<string, string> = {
      pdf: 'file-pdf',
      doc: 'file-word',
      docx: 'file-word',
      xls: 'file-excel',
      xlsx: 'file-excel',
      ppt: 'file-powerpoint',
      pptx: 'file-powerpoint',
      txt: 'file-text',
      jpg: 'file-image',
      jpeg: 'file-image',
      png: 'file-image',
    };

    return iconMap[extension] || 'file';
  },
  getMyResource: async (): Promise<ResourcesListResponse> => {
    try {
      const response = await apiClient.get<ResourcesListResponse>(
        `/api/resources/myResources`
      );

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to fetch resource');
      }
      throw new Error('An unexpected error occurred while fetching resource');
    }
  },
};
