import apiClient from './apiClient';

export interface AIMistakeAnalysis {
  mistakeType: string[];
  errorReason: string;
  explanation: string;
  knowledgePoints: string[];
  difficulty: string;
  improvement: string[];
}

export interface AIRecommendation {
  type: 'question' | 'knowledge' | 'review';
  targetId: string;
  priority: number;
  reason: string;
}

// AI分析错题
export const analyzeMistakeWithAI = async (params: {
  question: string;
  answer: string;
  correctAnswer: string;
}): Promise<AIMistakeAnalysis> => {
  const response = await apiClient.post<{ data: AIMistakeAnalysis }>('/ai/analyze-mistake', params);
  return response.data;
};

// AI生成学习推荐
export const generateAIRecommendations = async (limit = 10): Promise<AIRecommendation[]> => {
  const response = await apiClient.post<{ data: AIRecommendation[] }>('/ai/generate-recommendations', null, {
    params: { limit },
  });
  return response.data;
};

// AI问答
export const askAIQuestion = async (params: {
  question: string;
  context?: string;
}): Promise<{
  answer: string;
  relatedTopics?: string[];
}> => {
  const response = await apiClient.post<{ data: any }>('/ai/ask-question', params);
  return response.data;
};
