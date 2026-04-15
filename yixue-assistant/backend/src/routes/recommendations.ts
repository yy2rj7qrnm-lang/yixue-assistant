import express from 'express';
import { prisma } from '../database/prisma';
import { createError, asyncHandler, AuthRequest } from '../middleware/errorHandler';

const router = express.Router();

/**
 * @route   GET /api/recommendations
 * @desc    获取推荐列表
 * @access  Private
 */
router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const userId = req.user!.id;
    const {
      page = 1,
      limit = 20,
      type,
      sortBy = 'priority',
      sortOrder = 'desc',
      isCompleted,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    // 构建查询条件
    const where: any = { userId };

    if (type) {
      where.type = type;
    }
    if (isCompleted !== undefined) {
      where.isCompleted = isCompleted === 'true';
    }

    const skip = (pageNum - 1) * limitNum;

    // 查询推荐
    const [recommendations, total] = await Promise.all([
      prisma.recommendation.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          [sortBy as string]: sortOrder,
        },
      }),
      prisma.recommendation.count({ where }),
    ]);

    res.json({
      success: true,
      data: recommendations,
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
 * @route   GET /api/recommendations/:id
 * @desc    获取推荐详情
 * @access  Private
 */
router.get(
  '/:id',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const userId = req.user!.id;
    const { id } = req.params;

    const recommendation = await prisma.recommendation.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!recommendation) {
      throw createError('推荐不存在', 404);
    }

    res.json({
      success: true,
      data: recommendation,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   POST /api/recommendations/:id/complete
 * @desc    标记推荐为已完成
 * @access  Private
 */
router.post(
  '/:id/complete',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const userId = req.user!.id;
    const { id } = req.params;

    // 验证推荐所有权
    const existingRecommendation = await prisma.recommendation.findFirst({
      where: { id, userId },
    });

    if (!existingRecommendation) {
      throw createError('推荐不存在', 404);
    }

    const recommendation = await prisma.recommendation.update({
      where: { id },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: recommendation,
      message: '推荐已标记为完成',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   DELETE /api/recommendations/:id
 * @desc    删除推荐
 * @access  Private
 */
router.delete(
  '/:id',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const userId = req.user!.id;
    const { id } = req.params;

    // 验证推荐所有权
    const existingRecommendation = await prisma.recommendation.findFirst({
      where: { id, userId },
    });

    if (!existingRecommendation) {
      throw createError('推荐不存在', 404);
    }

    await prisma.recommendation.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: '推荐删除成功',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   POST /api/recommendations/generate
 * @desc    生成学习推荐
 * @access  Private
 */
router.post(
  '/generate',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const userId = req.user!.id;
    const { limit = 10 } = req.query;

    // 获取用户最近的错题
    const mistakes = await prisma.mistake.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string) || 10,
      select: {
        id: true,
        subject: true,
        questionText: true,
        difficulty: true,
        reviewCount: true,
        isSolved: true,
      },
    });

    if (mistakes.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: '暂无错题数据，无法生成推荐',
        timestamp: new Date().toISOString(),
      });
    }

    // 分析错题并生成推荐
    const recommendations = [];

    // 1. 优先推荐未解决的错题
    const unsolvedMistakes = mistakes.filter(m => !m.isSolved);
    for (const mistake of unsolvedMistakes.slice(0, 5)) {
      const priority = calculatePriority(mistake);
      recommendations.push({
        userId,
        type: 'review',
        targetId: mistake.id,
        priority,
        reason: `复习${mistake.subject}错题`,
      });
    }

    // 2. 推荐相关知识点
    const subjectGroups = mistakes.reduce((acc, m) => {
      if (!acc[m.subject]) {
        acc[m.subject] = 0;
      }
      acc[m.subject]++;
      return acc;
    }, {} as Record<string, number>);

    const weakSubjects = Object.entries(subjectGroups)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    for (const [subject, count] of weakSubjects) {
      if (count >= 3) {
        recommendations.push({
          userId,
          type: 'knowledge',
          targetId: subject,
          priority: 7,
          reason: `${subject}错题较多，建议复习相关知识点`,
        });
      }
    }

    // 3. 推荐练习题（这里简化处理）
    if (mistakes.length >= 5) {
      const difficultMistakes = mistakes.filter(m => m.difficulty === 'HARD');
      if (difficultMistakes.length > 0) {
        recommendations.push({
          userId,
          type: 'question',
          targetId: 'practice_difficult',
          priority: 6,
          reason: '加强难题练习',
        });
      }
    }

    // 保存推荐到数据库
    const createdRecommendations = [];
    for (const rec of recommendations) {
      const created = await prisma.recommendation.create({
        data: rec as any,
      });
      createdRecommendations.push(created);
    }

    res.json({
      success: true,
      data: createdRecommendations,
      message: '学习推荐生成完成',
      timestamp: new Date().toISOString(),
    });
  })
);

// 辅助函数
function calculatePriority(mistake: any): number {
  let priority = 5;

  // 错题次数多的优先级高
  if (mistake.reviewCount === 0) {
    priority += 3;
  } else if (mistake.reviewCount === 1) {
    priority += 2;
  }

  // 困难题优先级高
  if (mistake.difficulty === 'HARD') {
    priority += 2;
  } else if (mistake.difficulty === 'MEDIUM') {
    priority += 1;
  }

  // 最近错题优先级高
  const daysSinceCreated = Math.floor(
    (Date.now() - new Date(mistake.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceCreated <= 3) {
    priority += 1;
  }

  return Math.min(10, Math.max(1, priority));
}

export default router;