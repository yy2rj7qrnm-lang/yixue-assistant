// 用户相关类型
export interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  avatar?: string;
  grade?: string;
  subject?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

// 错题相关类型
export interface Mistake {
  id: string;
  userId: string;
  subject: Subject;
  grade: Grade;
  chapter: string;
  difficulty: Difficulty;
  questionType: QuestionType;
  questionImage: string;
  answer: string;
  correctAnswer: string;
  analysis?: string;
  knowledgePoints: string[];
  mistakeType: MistakeType[];
  createdAt: Date;
  isSolved: boolean;
  solvedAt?: Date;
  reviewCount: number;
  lastReviewAt?: Date;
}

// 知识点相关类型
export interface KnowledgePoint {
  id: string;
  name: string;
  subject: Subject;
  grade: Grade;
  chapter: string;
  difficulty: Difficulty;
  description?: string;
  relatedQuestions: string[];
  masteryLevel: number; // 0-100
}

// 学习报告相关类型
export interface LearningReport {
  id: string;
  userId: string;
  reportType: 'daily' | 'weekly' | 'monthly';
  period: {
    start: Date;
    end: Date;
  };
  totalMistakes: number;
  solvedMistakes: number;
  correctRate: number;
  knowledgePoints: {
    pointId: string;
    masteryLevel: number;
    practiceCount: number;
    correctCount: number;
  }[];
  studyTime: number; // 分钟
  averageDailyStudyTime: number;
  streakDays: number;
  createdAt: Date;
}

// 个性化推荐相关类型
export interface Recommendation {
  id: string;
  userId: string;
  type: 'question' | 'knowledge' | 'review';
  targetId: string; // questionId or knowledgePointId
  priority: number; // 1-10
  reason: string;
  isCompleted: boolean;
  createdAt: Date;
  completedAt?: Date;
}

// 统计数据相关类型
export interface Statistics {
  userId: string;
  totalQuestions: number;
  totalMistakes: number;
  solvedMistakes: number;
  correctRate: number;
  averageTimePerQuestion: number;
  studyStreak: number;
  weeklyStudyHours: number;
  subjectDistribution: {
    [key in Subject]: number;
  };
  difficultyDistribution: {
    [key in Difficulty]: number;
  };
  recentProgress: {
    date: Date;
    mistakes: number;
    solved: number;
    studyTime: number;
  }[];
}

// 题库相关类型
export interface Question {
  id: string;
  subject: Subject;
  grade: Grade;
  chapter: string;
  difficulty: Difficulty;
  questionType: QuestionType;
  content: string;
  options?: string[];
  correctAnswer: string;
  analysis: string;
  knowledgePoints: string[];
  tags: string[];
  createdAt: Date;
  isActive: boolean;
}

// 枚举类型
export enum Subject {
  MATH = 'math',
  CHINESE = 'chinese',
  ENGLISH = 'english',
  PHYSICS = 'physics',
  CHEMISTRY = 'chemistry',
  BIOLOGY = 'biology'
}

export enum Grade {
  GRADE_7 = 'grade7',
  GRADE_8 = 'grade8',
  GRADE_9 = 'grade9',
  GRADE_10 = 'grade10',
  GRADE_11 = 'grade11',
  GRADE_12 = 'grade12'
}

export enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

export enum QuestionType {
  SINGLE_CHOICE = 'single_choice',
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  FILL_BLANK = 'fill_blank',
  SHORT_ANSWER = 'short_answer',
  ESSAY = 'essay'
}

export enum MistakeType {
  CONCEPT_ERROR = 'concept_error',
  CALCULATION_ERROR = 'calculation_error',
  METHOD_ERROR = 'method_error',
  CARELESS_MISTAKE = 'careless_mistake',
  TIME_PRESSURE = 'time_pressure'
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: Date;
}

// 分页类型
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}