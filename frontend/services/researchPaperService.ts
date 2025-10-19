import { apiClient } from './authService';
import type {
  ResearchPaper,
  PaperSummary,
  PaperCitation,
  ResearchQuestion,
  UploadPaperResponse,
  RelatedPaper,
} from './types/researchPaper';

export type {
  ResearchPaper,
  PaperSummary,
  PaperCitation,
  ResearchQuestion,
  UploadPaperResponse,
  RelatedPaper,
};

/**
 * Upload a research paper (PDF or DOCX)
 */
const uploadPaper = async (file: File, title: string): Promise<UploadPaperResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);

    const response = await apiClient.post<UploadPaperResponse>('/api/research/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data?.message || error.response.data?.error || 'Failed to upload research paper');
    }
    throw new Error('Unexpected error while uploading research paper');
  }
};

/**
 * Get all research papers for the authenticated user
 */
const getUserPapers = async (): Promise<ResearchPaper[]> => {
  try {
    const response = await apiClient.get<{ success: boolean; papers: ResearchPaper[] }>('/api/research/list');
    return response.data.papers;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data?.message || error.response.data?.error || 'Failed to fetch research papers');
    }
    throw new Error('Unexpected error while fetching research papers');
  }
};

/**
 * Get a specific research paper with all analysis
 */
const getPaperById = async (paperId: string): Promise<ResearchPaper> => {
  try {
    const response = await apiClient.get<{ success: boolean; paper: ResearchPaper }>(`/api/research/${paperId}`);
    return response.data.paper;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data?.message || error.response.data?.error || 'Failed to fetch research paper');
    }
    throw new Error('Unexpected error while fetching research paper');
  }
};

/**
 * Delete a research paper
 */
const deletePaper = async (paperId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/api/research/${paperId}`);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data?.message || error.response.data?.error || 'Failed to delete research paper');
    }
    throw new Error('Unexpected error while deleting research paper');
  }
};

/**
 * Get related papers from Semantic Scholar (not saved to DB)
 */
const getRelatedPapers = async (paperId: string, limit = 10): Promise<RelatedPaper[]> => {
  try {
    const response = await apiClient.get<{ success: boolean; related_papers: RelatedPaper[] }>(
      `/api/research/${paperId}/related`,
      { params: { limit } }
    );
    return response.data.related_papers;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data?.message || error.response.data?.error || 'Failed to fetch related papers');
    }
    throw new Error('Unexpected error while fetching related papers');
  }
};

export const researchPaperService = {
  uploadPaper,
  getUserPapers,
  getPaperById,
  deletePaper,
  getRelatedPapers,
};
