import express from 'express';
import { prisma } from '../database/prisma';
import { createError, asyncHandler, AuthRequest } from '../middleware/errorHandler';

const router = express.Router();

/**
 * @route   GET /api/users/profile
 * @desc    获取用户个人资料
 * @access  Private
 */
router.get(
  '/profile',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        grade: true,
        subject: true,
        createdAt: true,
        lastLoginAt: true,
        isActive: true,
      },
    });

    if (!user) {
      throw createError('用户不存在', 404);
    }

    res.json({
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   PUT /api/users/profile
 * @desc    更新用户个人资料
 * @access  Private
 */
router.put(
  '/profile',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const userId = req.user!.id;
    const { name, avatar, grade, subject } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(avatar !== undefined && { avatar }),
        ...(grade !== undefined && { grade }),
        ...(subject !== undefined && { subject }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        grade: true,
        subject: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: user,
      message: '个人资料更新成功',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   GET /api/users/settings
 * @desc    获取用户设置
 * @access  Private
 */
router.get(
  '/settings',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const userId = req.user!.id;

    // 这里可以从settings表获取，或者扩展user表
    // 暂时返回一些默认设置
    const settings = {
      userId,
      theme: 'light',
      language: 'zh-CN',
      notifications: {
        email: true,
        push: true,
        reviewReminder: true,
        dailySummary: true,
      },
      study: {
        dailyGoalMinutes: 30,
        dailyGoalMistakes: 10,
        reviewInterval: 7,
      },
    };

    res.json({
      success: true,
      data: settings,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   PUT /api/users/settings
 * @desc    更新用户设置
 * @access  Private
 */
router.put(
  '/settings',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const userId = req.user!.id;
    const { theme, language, notifications, study } = req.body;

    // 这里可以保存到settings表
    // 暂时返回确认

    res.json({
      success: true,
      data: {
        userId,
        theme,
        language,
        notifications,
        study,
      },
      message: '设置更新成功',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   GET /api/users/students
 * @desc    获取绑定的学生列表（家长端）
 * @access  Private
 */
router.get(
  '/students',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const userId = req.user!.id;

    // 暂时返回空列表，后续可以绑定学生
    const students = [];

    res.json({
      success: true,
      data: students,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;