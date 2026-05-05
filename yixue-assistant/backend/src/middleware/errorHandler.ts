import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export { AuthRequest } from './auth';

export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

export const createError = (message: string, statusCode: number = 500): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { statusCode = 500, message } = err;

  // 记录错误日志
  logger.error(`错误: ${message}`, {
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // 处理特定错误类型
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = '输入数据验证失败';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'ID格式错误';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = '无效的令牌';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = '令牌已过期';
  }

  // 开发环境下返回详细错误信息
  const response = {
    success: false,
    message: process.env.NODE_ENV === 'development' ? message : '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(response);
};

// 异步错误处理包装器
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404处理
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = createError(`未找到路由 - ${req.originalUrl}`, 404);
  next(error);
};