import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createError } from './errorHandler';
import { prisma } from '../database/prisma';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw createError('访问被拒绝，请提供令牌', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw createError('用户不存在或已被禁用', 401);
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(createError('无效的令牌', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(createError('令牌已过期', 401));
    } else {
      next(error);
    }
  }
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, name: true, isActive: true },
      });

      if (user && user.isActive) {
        req.user = {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      }
    }

    next();
  } catch (error) {
    // 可选认证失败继续执行
    next();
  }
};

// 角色权限中间件（未来扩展）
export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError('请先登录', 401));
    }

    // 这里可以根据需要添加角色检查逻辑
    // 目前简单返回允许访问
    next();
  };
};