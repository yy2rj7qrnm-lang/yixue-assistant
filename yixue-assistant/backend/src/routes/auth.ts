import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../database/prisma';
import { createError, asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    用户注册
 * @access  Public
 */
router.post(
  '/register',
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { name, email, password, grade, subject } = req.body;

    // 验证必填字段
    if (!name || !email || !password) {
      throw createError('请填写完整的注册信息', 400);
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw createError('该邮箱已被注册', 400);
    }

    // 密码加密
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        grade,
        subject,
      },
      select: {
        id: true,
        email: true,
        name: true,
        grade: true,
        subject: true,
        createdAt: true,
      },
    });

    // 生成token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        user,
        token,
      },
      message: '注册成功',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   POST /api/auth/login
 * @desc    用户登录
 * @access  Public
 */
router.post(
  '/login',
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { email, password } = req.body;

    // 验证必填字段
    if (!email || !password) {
      throw createError('请填写邮箱和密码', 400);
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw createError('邮箱或密码错误', 401);
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw createError('邮箱或密码错误', 401);
    }

    // 检查账号状态
    if (!user.isActive) {
      throw createError('账号已被禁用', 403);
    }

    // 更新最后登录时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 生成token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          grade: user.grade,
          subject: user.subject,
        },
      },
      message: '登录成功',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   POST /api/auth/logout
 * @desc    用户登出
 * @access  Private
 */
router.post(
  '/logout',
  asyncHandler(async (req: express.Request, res: express.Response) => {
    // 在实际应用中，可以将token添加到黑名单
    // 这里简单返回成功

    res.json({
      success: true,
      message: '登出成功',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    刷新token
 * @access  Public
 */
router.post(
  '/refresh-token',
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      throw createError('请提供刷新令牌', 400);
    }

    // 验证刷新令牌
    try {
      const decoded = jwt.verify(
        refresh_token,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'your-secret-key'
      ) as any;

      // 查找用户
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        throw createError('用户不存在或已被禁用', 401);
      }

      // 生成新token
      const newToken = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        data: {
          token: newToken,
        },
        message: '刷新成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      throw createError('无效的刷新令牌', 401);
    }
  })
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    重置密码
 * @access  Public
 */
router.post(
  '/reset-password',
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { email } = req.body;

    if (!email) {
      throw createError('请提供邮箱地址', 400);
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true },
    });

    if (!user) {
      // 即使邮箱不存在也返回成功，防止邮箱枚举攻击
      return res.json({
        success: true,
        message: '如果该邮箱已注册，您将收到重置链接',
        timestamp: new Date().toISOString(),
      });
    }

    // 在实际应用中，这里应该发送重置密码邮件
    // 暂时返回成功消息

    res.json({
      success: true,
      message: '重置链接已发送到您的邮箱',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   GET /api/auth/validate
 * @desc    验证token
 * @access  Private
 */
router.get(
  '/validate',
  asyncHandler(async (req: express.Request, res: express.Response) => {
    // 如果执行到这里，说明token验证通过（通过了authMiddleware）
    res.json({
      success: true,
      message: 'Token有效',
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;