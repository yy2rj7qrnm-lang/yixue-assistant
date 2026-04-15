import express from 'express';
import { prisma } from '../database/prisma';
import { createError, asyncHandler, AuthRequest } from '../middleware/errorHandler';

const router = express.Router();

/**
 * @route   GET /api/reports
 * @desc    获取学习报告列表
 * @access  Private
 */
router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const userId = req.user!.id;
    const {
      page = 1,
      limit = 20,
      reportType,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    // 构建查询条件
    const where: any = { userId };

    if (reportType) {
      where.reportType = reportType;
    }

    const skip = (pageNum - 1) * limitNum;

    // 查询报告
    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          [sortBy as string]: sortOrder,
        },
      }),
      prisma.report.count({ where }),
    ]);

    res.json({
      success: true,
      data: reports,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   GET /api/reports/:id
 * @desc    获取报告详情
 * @access  Private
 */
router.get(
  '/:id',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const userId = req.user!.id;
    const { id } = req.params;

    const report = await prisma.report.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!report) {
      throw createError('报告不存在', 404);
    }

    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   POST /api/reports/generate
 * @desc    生成学习报告
 * @access  Private
 */
router.post(
  '/generate',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const userId = req.user!.id;
    const { reportType = 'weekly' } = req.body;

    // 计算报告周期
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (reportType) {
      case 'daily':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
    }

    // 获取周期内的错题数据
    const mistakes = await prisma.mistake.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalMistakes = mistakes.length;
    const solvedMistakes = mistakes.filter(m => m.isSolved).length;
    const correctRate = totalMistakes > 0 ? (solvedMistakes / totalMistakes) * 100 : 0;

    // 计算学习时间（这里简化处理）
    const studyTime = totalMistakes * 30; // 假设每个错题学习30分钟
    const averageDailyStudyTime = studyTime / 7;

    // 计算连续学习天数
    const streakDays = await calculateStreakDays(userId);

    // 统计知识点掌握情况
    const knowledgePointsData = await calculateKnowledgePoints(userId);

    // 创建报告
    const report = await prisma.report.create({
      data: {
        userId,
        reportType: reportType as any,
        period: {
          start: startDate,
          end: endDate,
        },
        totalMistakes,
        solvedMistakes,
        correctRate,
        knowledgePoints: knowledgePointsData,
        studyTime,
        averageDailyStudyTime,
        streakDays,
      },
    });

    res.json({
      success: true,
      data: report,
      message: '报告生成成功',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   GET /api/reports/statistics
 * @desc    获取用户统计数据
 * @access  Private
 */
router.get(
  '/statistics',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const userId = req.user!.id;

    // 获取所有错题
    const mistakes = await prisma.mistake.findMany({
      where: { userId },
    });

    const totalQuestions = mistakes.length * 2;
    const totalMistakes = mistakes.length;
    const solvedMistakes = mistakes.filter(m => m.isSolved).length;
    const correctRate = totalQuestions > 0 ? (solvedMistakes / totalQuestions) * 100 : 0;

    // 计算连续学习天数
    const studyStreak = await calculateStreakDays(userId);

    // 计算本周学习时间（简化）
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyMistakes = mistakes.filter(m => m.createdAt >= weekAgo);
    const weeklyStudyHours = weeklyMistakes.length * 0.5; // 每个错题0.5小时

    // 学科分布
    const subjectDistribution = mistakes.reduce((acc, m) => {
      acc[m.subject] = (acc[m.subject] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 难度分布
    const difficultyDistribution = mistakes.reduce((acc, m) => {
      acc[m.difficulty] = (acc[m.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      data: {
        totalQuestions,
        totalMistakes,
        solvedMistakes,
        correctRate,
        studyStreak,
        weeklyStudyHours,
        subjectDistribution,
        difficultyDistribution,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   DELETE /api/reports/:id
 * @desc    删除报告
 * @access  Private
 */
router.delete(
  '/:id',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const userId = req.user!.id;
    const { id } = req.params;

    // 验证报告所有权
    const existingReport = await prisma.report.findFirst({
      where: { id, userId },
    });

    if (!existingReport) {
      throw createError('报告不存在', 404);
    }

    await prisma.report.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: '报告删除成功',
      timestamp: new Date().toISOString(),
    });
  })
);

// 辅助函数
async function calculateStreakDays(userId: string): Promise<number> {
  const mistakes = await prisma.mistake.findMany({
    where: { userId },
    select: { createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  if (mistakes.length === 0) return 0;

  const uniqueDays = new Set(
    mistakes.map(m => m.createdAt.toDateString())
  );

  // 计算连续天数
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);

    if (uniqueDays.has(checkDate.toDateString())) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return streak;
}

async function calculateKnowledgePoints(userId: string): any {
  const mistakes = await prisma.mistake.findMany({
    where: { userId },
    select: { knowledgePoints: true },
  });

  const knowledgeMap = new Map<string, { count: number; mastery: number }>();

  mistakes.forEach(mistake => {
    try {
      const points = JSON.parse(mistake.knowledgePoints || '[]');
      points.forEach((point: string) => {
        const existing = knowledgeMap.get(point) || { count: 0, mastery: 0 };
        knowledgeMap.set(point, {
          count: existing.count + 1,
          mastery: Math.max(0, existing.mastery - 10),
        });
      });
    } catch (error) {
      console.error('解析知识点失败:', error);
    }
  });

  // 计算已解决错题的知识点掌握度
  const solvedMistakes = mistakes.filter(m => m.isSolved);
  solvedMistakes.forEach(mistake => {
    try {
      const points = JSON.parse(mistake.knowledgePoints || '[]');
      points.forEach((point: string) => {
        const existing = knowledgeMap.get(point) || { count: 0, mastery: 0 };
        knowledgeMap.set(point, {
          count: existing.count,
          mastery: existing.mastery + 20,
        });
      });
    } catch (error) {
      console.error('解析知识点失败:', error);
    }
  });

  // 转换为数组格式
  return Array.from(knowledgeMap.entries()).map(([name, data]) => ({
    name,
    count: data.count,
    mastery: Math.min(100, Math.max(0, data.mastery)),
  }));
}

export default router;