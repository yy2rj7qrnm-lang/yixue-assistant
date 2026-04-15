import apiClient from './apiClient';

export interface Mistake {
  id: string;
  questionText: string;
  questionImage?: string;
  answer: string;
  correctAnswer: string;
  subject: string;
  grade: string;
  difficulty: string;
  questionType: string;
  knowledgePoints: string[];
  analysis?: string;
  isSolved: boolean;
  reviewCount: number;
  createdAt: string;
}

export interface CreateMistakeParams {
  questionImage?: string;
  questionText: string;
  answer: string;
  correctAnswer: string;
  subject: string;
  grade: string;
  difficulty: string;
  questionType: string;
  knowledgePoints: string[];
  analysis?: string;
}

export interface ReviewMistakeParams {
  mastery: number;
  notes?: string;
}

export interface MistakeListParams {
  page?: number;
  limit?: number;
  subject?: string;
  isSolved?: boolean;
  difficulty?: string;
}

export interface MistakeListResponse {
  data: Mistake[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 获取错题列表
export const getMistakes = async (params: MistakeListParams = {}): Promise<MistakeListResponse> => {
  const response = await apiClient.get<MistakeListResponse>('/mistakes', params);
  return response;
};

// 获取错题详情
export const getMistakeDetail = async (id: string): Promise<Mistake> => {
  const response = await apiClient.get<Mistake>(`/mistakes/${id}`);
  return response;
};

// 创建错题
export const createMistake = async (params: CreateMistakeParams): Promise<Mistake> => {
  const response = await apiClient.post<{ data: Mistake }>('/mistakes', params);
  return response.data;
};

// 更新错题
export const updateMistake = async (id: string, params: Partial<CreateMistakeParams>): Promise<Mistake> => {
  const response = await apiClient.put<{ data: Mistake }>(`/mistakes/${id}`, params);
  return response.data;
};

// 删除错题
export const deleteMistake = async (id: string): Promise<void> => {
  await apiClient.delete(`/mistakes/${id}`);
};

// 标记错题为已解决
export const reviewMistake = async (id: string, params: ReviewMistakeParams): Promise<void> => {
  await apiClient.post(`/mistakes/${id}/review`, params);
};

// 搜索错题
export const searchMistakes = async (keyword: string, params: MistakeListParams = {}): Promise<MistakeListResponse> => {
  const response = await apiClient.get<MistakeListResponse>('/mistakes/search', {
    q: keyword,
    ...params,
  });
  return response;
};

// 获取错题统计
export const getMistakeStats = async (): Promise<{
  total: number;
  solved: number;
  unsolved: number;
  bySubject: Record<string, number>;
  byDifficulty: Record<string, number>;
}> => {
  const response = await apiClient.get('/mistakes/stats');
  return response;
};
