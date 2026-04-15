import apiClient from './apiClient';
import { Mistake } from './mistakeService';

export interface KnowledgePoint {
  id: string;
  name: string;
  subject: string;
  grade: string;
  masteryLevel: number;
  relatedQuestions: number;
  relatedMistakes: number;
}

export interface Question {
  id: string;
  subject: string;
  grade: string;
  chapter: string;
  difficulty: string;
  questionType: string;
  content: string;
  options?: string[];
  correctAnswer: string;
  analysis: string;
  knowledgePoints: string[];
}

export interface StudyRecommendation {
  type: 'question' | 'knowledge' | 'review';
  targetId: string;
  priority: number;
  reason: string;
  question?: Question;
  knowledgePoint?: KnowledgePoint;
}

export interface StudyReport {
  id: string;
  reportType: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  stats: {
    studyTime: number;
    questionsAttempted: number;
    correctRate: number;
    mistakesSolved: number;
  };
  recommendations: StudyRecommendation[];
}

// 获取知识点列表
export const getKnowledgePoints = async (params: {
  subject?: string;
  grade?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: KnowledgePoint[]; pagination: any }> => {
  const response = await apiClient.get('/knowledge', params);
  return response;
};

// 更新知识点掌握度
export const updateMastery = async (id: string, masteryLevel: number): Promise<void> => {
  await apiClient.post(`/knowledge/${id}/mastery`, { masteryLevel });
};

// 获取推荐列表
export const getRecommendations = async (params: {
  type?: string;
  isCompleted?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ data: StudyRecommendation[] }> => {
  const response = await apiClient.get('/recommendations', params);
  return response;
};

// 生成推荐
export const generateRecommendations = async (): Promise<void> => {
  await apiClient.post('/recommendations/generate');
};

// 标记推荐为已完成
export const completeRecommendation = async (id: string): Promise<void> => {
  await apiClient.post(`/recommendations/${id}/complete`);
};

// 获取题目列表
export const getQuestions = async (params: {
  subject?: string;
  grade?: string;
  difficulty?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: Question[]; pagination: any }> => {
  const response = await apiClient.get('/questions', params);
  return response;
};

// 获取题目详情
export const getQuestionDetail = async (id: string): Promise<Question> => {
  const response = await apiClient.get(`/questions/${id}`);
  return response;
};

// 提交题目答案
export const submitAnswer = async (id: string, answer: string, timeSpent?: number): Promise<{
  attempt: any;
  isCorrect: boolean;
  correctAnswer: string;
  analysis: string | null;
}> => {
  const response = await apiClient.post(`/questions/${id}/attempt`, {
    answer,
    timeSpent,
  });
  return response;
};

// 搜索题目
export const searchQuestions = async (keyword: string, params?: {
  page?: number;
  limit?: number;
}): Promise<{ data: Question[]; pagination: any }> => {
  const response = await apiClient.get('/questions/search', {
    q: keyword,
    ...params,
  });
  return response;
};

// 获取推荐题目
export const getRecommendedQuestions = async (limit = 10): Promise<Question[]> => {
  const response = await apiClient.get('/questions/recommend', { limit });
  return response.data;
};

// 获取报告列表
export const getReports = async (params: {
  reportType?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: StudyReport[]; pagination: any }> => {
  const response = await apiClient.get('/reports', params);
  return response;
};

// 生成学习报告
export const generateReport = async (reportType: 'daily' | 'weekly' | 'monthly'): Promise<StudyReport> => {
  const response = await apiClient.post<{ data: StudyReport }>('/reports/generate', { reportType });
  return response.data;
};

// 获取统计数据
export const getStatistics = async (): Promise<{
  totalQuestions: number;
  totalMistakes: number;
  solvedMistakes: number;
  correctRate: number;
  studyStreak: number;
  weeklyStudyHours: number;
  subjectDistribution: Record<string, number>;
  difficultyDistribution: Record<string, number>;
}> => {
  const response = await apiClient.get('/reports/statistics');
  return response;
};
