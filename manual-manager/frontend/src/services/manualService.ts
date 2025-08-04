import { apiClient } from './api';
import {
  Manual,
  CreateManualForm,
  UpdateManualForm,
  PaginatedResponse,
  SearchFilters,
  ApiResponse,
} from '@/types';

export const manualService = {
  // Get all manuals with pagination and filters
  getManuals: async (
    page: number = 1,
    limit: number = 10,
    filters?: SearchFilters
  ): Promise<PaginatedResponse<Manual>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters) {
      if (filters.query) params.append('query', filters.query);
      if (filters.status) {
        filters.status.forEach(status => params.append('status', status));
      }
      if (filters.tags) {
        filters.tags.forEach(tag => params.append('tags', tag));
      }
      if (filters.authorId) params.append('authorId', filters.authorId);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
      if (filters.dateTo) params.append('dateTo', filters.dateTo.toISOString());
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    }

    const response = await apiClient.get<PaginatedResponse<Manual>>(
      `/manuals?${params.toString()}`
    );
    return response.data!;
  },

  // Get manual by ID
  getManual: async (id: string): Promise<Manual> => {
    const response = await apiClient.get<Manual>(`/manuals/${id}`);
    return response.data!;
  },

  // Create new manual
  createManual: async (data: CreateManualForm): Promise<Manual> => {
    const response = await apiClient.post<Manual>('/manuals', data);
    return response.data!;
  },

  // Update manual
  updateManual: async (id: string, data: UpdateManualForm): Promise<Manual> => {
    const response = await apiClient.put<Manual>(`/manuals/${id}`, data);
    return response.data!;
  },

  // Delete manual
  deleteManual: async (id: string): Promise<void> => {
    await apiClient.delete(`/manuals/${id}`);
  },

  // Generate manual from URL
  generateManual: async (id: string): Promise<{ generationId: string }> => {
    const response = await apiClient.post<{ generationId: string }>(
      `/manuals/${id}/generate`
    );
    return response.data!;
  },

  // Regenerate manual
  regenerateManual: async (id: string): Promise<{ generationId: string }> => {
    const response = await apiClient.post<{ generationId: string }>(
      `/manuals/${id}/regenerate`
    );
    return response.data!;
  },

  // Get manual content (markdown)
  getManualContent: async (id: string): Promise<{ content: string }> => {
    const response = await apiClient.get<{ content: string }>(
      `/manuals/${id}/content`
    );
    return response.data!;
  },

  // Update manual content
  updateManualContent: async (
    id: string,
    content: string
  ): Promise<Manual> => {
    const response = await apiClient.put<Manual>(`/manuals/${id}/content`, {
      content,
    });
    return response.data!;
  },

  // Get manual HTML
  getManualHtml: async (id: string): Promise<{ html: string }> => {
    const response = await apiClient.get<{ html: string }>(
      `/manuals/${id}/html`
    );
    return response.data!;
  },

  // Export manual as PDF
  exportToPdf: async (id: string): Promise<{ url: string }> => {
    const response = await apiClient.post<{ url: string }>(
      `/manuals/${id}/export/pdf`
    );
    return response.data!;
  },

  // Export manual as HTML
  exportToHtml: async (id: string): Promise<{ url: string }> => {
    const response = await apiClient.post<{ url: string }>(
      `/manuals/${id}/export/html`
    );
    return response.data!;
  },

  // Get manual screenshots
  getScreenshots: async (id: string): Promise<{ screenshots: string[] }> => {
    const response = await apiClient.get<{ screenshots: string[] }>(
      `/manuals/${id}/screenshots`
    );
    return response.data!;
  },

  // Search manuals
  searchManuals: async (
    query: string,
    filters?: Omit<SearchFilters, 'query'>
  ): Promise<Manual[]> => {
    const params = new URLSearchParams({ query });

    if (filters) {
      if (filters.status) {
        filters.status.forEach(status => params.append('status', status));
      }
      if (filters.tags) {
        filters.tags.forEach(tag => params.append('tags', tag));
      }
      if (filters.authorId) params.append('authorId', filters.authorId);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
      if (filters.dateTo) params.append('dateTo', filters.dateTo.toISOString());
    }

    const response = await apiClient.get<Manual[]>(
      `/manuals/search?${params.toString()}`
    );
    return response.data!;
  },

  // Get manual tags
  getManualTags: async (id: string): Promise<string[]> => {
    const response = await apiClient.get<string[]>(`/manuals/${id}/tags`);
    return response.data!;
  },

  // Update manual tags
  updateManualTags: async (id: string, tags: string[]): Promise<Manual> => {
    const response = await apiClient.put<Manual>(`/manuals/${id}/tags`, {
      tags,
    });
    return response.data!;
  },

  // Duplicate manual
  duplicateManual: async (id: string, title?: string): Promise<Manual> => {
    const response = await apiClient.post<Manual>(`/manuals/${id}/duplicate`, {
      title,
    });
    return response.data!;
  },

  // Get manual statistics
  getManualStats: async (id: string): Promise<{
    views: number;
    downloads: number;
    lastAccessed: Date;
    generationTime: number;
  }> => {
    const response = await apiClient.get<{
      views: number;
      downloads: number;
      lastAccessed: string;
      generationTime: number;
    }>(`/manuals/${id}/stats`);
    
    return {
      ...response.data!,
      lastAccessed: new Date(response.data!.lastAccessed),
    };
  },

  // Get recent manuals
  getRecentManuals: async (limit: number = 5): Promise<Manual[]> => {
    const response = await apiClient.get<Manual[]>(
      `/manuals/recent?limit=${limit}`
    );
    return response.data!;
  },

  // Get popular manuals
  getPopularManuals: async (limit: number = 5): Promise<Manual[]> => {
    const response = await apiClient.get<Manual[]>(
      `/manuals/popular?limit=${limit}`
    );
    return response.data!;
  },

  // Validate URL before creating manual
  validateUrl: async (url: string): Promise<{
    valid: boolean;
    title?: string;
    description?: string;
    error?: string;
  }> => {
    const response = await apiClient.post<{
      valid: boolean;
      title?: string;
      description?: string;
      error?: string;
    }>('/manuals/validate-url', { url });
    return response.data!;
  },
};

export default manualService;