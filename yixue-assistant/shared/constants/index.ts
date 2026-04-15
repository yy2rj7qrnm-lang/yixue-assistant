// 应用常量定义

// API端点
export const API_ENDPOINTS = {
  // 认证相关
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH_TOKEN: '/api/auth/refresh',
    RESET_PASSWORD: '/api/auth/reset-password',
  },

  // 用户相关
  USERS: {
    PROFILE: '/api/users/profile',
    UPDATE_PROFILE: '/api/users/profile',
    SETTINGS: '/api/users/settings',
    STUDENTS: '/api/users/students',
  },

  // 错题相关
  MISTAKES: {
    LIST: '/api/mistakes',
    CREATE: '/api/mistakes',
    UPDATE: '/api/mistakes/:id',
    DELETE: '/api/mistakes/:id',
    ANALYZE: '/api/mistakes/analyze',
    REVIEW: '/api/mistakes/:id/review',
    BATCH: '/api/mistakes/batch',
  },

  // 知识点相关
  KNOWLEDGE: {
    LIST: '/api/knowledge',
    DETAIL: '/api/knowledge/:id',
    MASTERY: '/api/knowledge/:id/mastery',
    RELATED: '/api/knowledge/related',
  },

  // 学习报告相关
  REPORTS: {
    LIST: '/api/reports',
    DETAIL: '/api/reports/:id',
    GENERATE: '/api/reports/generate',
    STATISTICS: '/api/reports/statistics',
  },

  // 推荐相关
  RECOMMENDATIONS: {
    LIST: '/api/recommendations',
    MARK_COMPLETE: '/api/recommendations/:id/complete',
    GENERATE: '/api/recommendations/generate',
  },

  // 题库相关
  QUESTIONS: {
    LIST: '/api/questions',
    DETAIL: '/api/questions/:id',
    SEARCH: '/api/questions/search',
    RECOMMEND: '/api/questions/recommend',
  },

  // OCR服务
  OCR: {
    RECOGNIZE: '/api/ocr/recognize',
    ANALYZE: '/api/ocr/analyze',
  },
} as const;

// 错误代码
export const ERROR_CODES = {
  // 通用错误
  UNKNOWN_ERROR: 1000,
  NETWORK_ERROR: 1001,
  SERVER_ERROR: 1002,
  VALIDATION_ERROR: 1003,

  // 认证错误
  UNAUTHORIZED: 2001,
  TOKEN_EXPIRED: 2002,
  INVALID_TOKEN: 2003,
  ACCOUNT_DISABLED: 2004,

  // 业务错误
  USER_NOT_FOUND: 3001,
  EMAIL_ALREADY_EXISTS: 3002,
  INVALID_PASSWORD: 3003,
  MISTAKE_NOT_FOUND: 3004,
  INVALID_QUESTION: 3005,

  // OCR错误
  OCR_FAILED: 4001,
  IMAGE_INVALID: 4002,
  TEXT_TOO_SMALL: 4003,
} as const;

// 存储键
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_INFO: 'user_info',
  SETTINGS: 'app_settings',
  OFFLINE_CACHE: 'offline_cache',
} as const;

// 应用设置
export const APP_SETTINGS = {
  NAME: '意学助手',
  VERSION: '1.0.0',
  THEME: {
    LIGHT: 'light',
    DARK: 'dark',
    AUTO: 'auto',
  },
  LANGUAGE: {
    ZH_CN: 'zh-CN',
    EN_US: 'en-US',
  },
} as const;

// 学习相关常量
export const LEARNING_SETTINGS = {
  // 复习间隔（天）
  REVIEW_INTERVALS: [1, 3, 7, 14, 30, 90],

  // 每日学习目标
  DAILY_GOALS: {
    MINUTES: 30,
    MISTAKES: 10,
    REVIEWS: 5,
  },

  // 知识点掌握等级
  MASTERY_LEVELS: {
    NEW: 0,
    LEARNING: 30,
    FAMILIAR: 60,
    MASTERED: 80,
    EXPERT: 100,
  },

  // 错题类型权重
  MISTAKE_WEIGHTS: {
    CONCEPT_ERROR: 0.3,
    CALCULATION_ERROR: 0.2,
    METHOD_ERROR: 0.3,
    CARELESS_MISTAKE: 0.1,
    TIME_PRESSURE: 0.1,
  },
} as const;

// OCR相关配置
export const OCR_SETTINGS = {
  // 支持的图片格式
  SUPPORTED_FORMATS: ['jpg', 'jpeg', 'png', 'webp'],

  // 图片大小限制（MB）
  MAX_FILE_SIZE: 10,

  // 图片分辨率限制
  MIN_RESOLUTION: { width: 800, height: 600 },
  MAX_RESOLUTION: { width: 4000, height: 4000 },

  // OCR服务配置
  SERVICES: {
    BAIDU: {
      APP_ID: process.env.BAIDU_OCR_APP_ID,
      API_KEY: process.env.BAIDU_OCR_API_KEY,
      SECRET_KEY: process.env.BAIDU_OCR_SECRET_KEY,
    },
    TENCENT: {
      SECRET_ID: process.env.TENCENT_OCR_SECRET_ID,
      SECRET_KEY: process.env.TENCENT_OCR_SECRET_KEY,
    },
  },
} as const;

// API超时配置
export const API_TIMEOUTS = {
  DEFAULT: 30000, // 30秒
  UPLOAD: 60000, // 60秒
  OCR: 45000, // 45秒
  ANALYSIS: 90000, // 90秒
} as const;

// WebSocket事件
export const WS_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',

  // 学习相关事件
  MISTAKE_ADDED: 'mistake_added',
  REVIEW_NOTIFICATION: 'review_notification',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',

  // 实时数据更新
  STATS_UPDATE: 'stats_update',
  PROGRESS_UPDATE: 'progress_update',
} as const;

// 缓存配置
export const CACHE_CONFIG = {
  TTL: {
    USER: 3600, // 1小时
    STATS: 300, // 5分钟
    RECOMMENDATIONS: 600, // 10分钟
    KNOWLEDGE_POINTS: 1800, // 30分钟
  },

  KEY_PREFIXES: {
    USER: 'user:',
    STATS: 'stats:',
    RECOMMENDATIONS: 'rec:',
    KNOWLEDGE: 'knowledge:',
  },
} as const;