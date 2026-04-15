import express from 'express';
import { prisma } from '../database/prisma';
import { createError, asyncHandler, AuthRequest } from '../middleware/errorHandler';

const router = express.Router();

/**
 * @route   GET /api/mistakes
 * @desc    获取错题列表
 * @access  Private
 */
router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const userId = req.user!.id;
    const {
      page = 1,
      limit = 20,
      subject,
      grade,
      isSolved,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    // 构建查询条件
    const where: any = { userId };

    if (subject) {
      where.subject = subject;
    }
    if (grade) {
      where.grade = grade;
    }
    if (isSolved !== undefined) {
      where.isSolved = isSolved === 'true';
    }

    // 计算分页
    const skip = (pageNum - 1) * limitNum;

    // 查询错题
    const [mistakes, total] = await Promise.all([
      prisma.mistake.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          [sortBy as string]: sortOrder,
        },
        include: {
          reviews: {
            take: 1,
            orderBy: { reviewTime: 'desc' },
          },
        },
      }),
      prisma.mistake.count({ where }),
    ]);

    res.json({
      success: true,
      data: mistakes,
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
 * @route   GET /api/mistakes/:id
 * @desc    获取错题详情
 * @access  Private
 */
router.get(
  '/:id',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const userId = req.user!.id;
    const { id } = req.params;

    const mistake = await prisma.mistake.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        reviews: {
          orderBy: { reviewTime: 'desc' },
        },
      },
    });

    if (!mistake) {
      throw createError('错题不存在', 404);
    }

    res.json({
      success: true,
      data: mistake,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   POST /api/mistakes
 * @desc    创建错题
 * @access  Private
 */
router.post(
  '/',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const userId = req.user!.id;
    const {
      questionImage,
      questionText,
      answer,
      correctAnswer,
      analysis,
      subject,
      grade,
      chapter,
      difficulty,
      questionType,
      knowledgePoints,
      mistakeType,
    } = req.body;

    const mistake = await prisma.mistake.create({
      data: {
        userId,
        questionImage,
        questionText,
        answer,
        correctAnswer,
        analysis,
        subject: subject || 'MATH',
        grade: grade || 'GRADE_10',
        chapter,
        difficulty: difficulty || 'MEDIUM',
        questionType: questionType || 'SHORT_ANSWER',
        knowledgePoints: JSON.stringify(knowledgePoints || []),
        mistakeType: JSON.stringify(mistakeType || []),
      },
    });

    // 更新统计数据
    await updateStatistics(userId);

    res.status(201).json({
      success: true,
      data: mistake,
      message: '错题创建成功',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   PUT /api/mistakes/:id
 * @desc    更新错题
 * @access  Private
 */
router.put(
  '/:id',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const updateData = req.body;

    // 验证错题所有权
    const existingMistake = await prisma.mistake.findFirst({
      where: { id, userId },
    });

    if (!existingMistake) {
      throw createError('错题不存在', 404);
    }

    const mistake = await prisma.mistake.update({
      where: { id },
      data: {
        ...updateData,
        knowledgePoints: updateData.knowledgePoints
          ? JSON.stringify(updateData.knowledgePoints)
          : undefined,
        mistakeType: updateData.mistakeType
          ? JSON.stringify(updateData.mistakeType)
          : undefined,
      },
    });

    res.json({
      success: true,
      data: mistake,
      message: '错题更新成功',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   DELETE /api/mistakes/:id
 * @desc    删除错题
 * @access  Private
 */
router.delete(
  '/:id',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const userId = req.user!.id;
    const { id } = req.params;

    // 验证错题所有权
    const existingMistake = await prisma.mistake.findFirst({
      where: { id, userId },
    });

    if (!existingMistake) {
      throw createError('错题不存在', 404);
    }

    await prisma.mistake.delete({
      where: { id },
    });

    // 更新统计数据
    await updateStatistics(userId);

    res.json({
      success: true,
      message: '错题删除成功',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   POST /api/mistakes/:id/review
 * @desc    标记错题为已解决
 * @access  Private
 */
router.post(
  '/:id/review',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const { mastery = 100, notes } = req.body;

    // 验证错题所有权
    const existingMistake = await prisma.mistake.findFirst({
      where: { id, userId },
    });

    if (!existingMistake) {
      throw createError('错题不存在', 404);
    }

    // 更新错题状态
    const mistake = await prisma.mistake.update({
      where: { id },
      data: {
        isSolved: true,
        solvedAt: new Date(),
        reviewCount: existingMistake.reviewCount + 1,
        lastReviewAt: new Date(),
      },
    });

    // 创建复习记录
    const review = await prisma.review.create({
      data: {
        mistakeId: id,
        userId,
        reviewTime: new Date(),
        mastery,
        notes,
      },
    });

    // 更新统计数据
    await updateStatistics(userId);

    res.json({
      success: true,
      data: { mistake, review },
      message: '错题已标记为解决',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   POST /api/mistakes/batch
 * @desc    批量操作错题
 * @access  Private
 */
router.post(
  '/batch',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const userId = req.user!.id;
    const { ids, action } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw createError('请提供错题ID列表', 400);
    }

    const results = [];

    for (const id of ids) {
      try {
        switch (action) {
          case 'delete':
            await prisma.mistake.deleteMany({
              where: { id, userId },
            });
            results.push({ id, success: true });
            break;
          case 'solve':
            await prisma.mistake.updateMany({
              where: { id, userId },
              data: {
                isSolved: true,
                solvedAt: new Date(),
              },
            });
            results.push({ id, success: true });
            break;
          case 'unsolve':
            await prisma.mistake.updateMany({
              where: { id, userId },
              data: {
                isSolved: false,
                solvedAt: null,
              },
            });
            results.push({ id, success: true });
            break;
          default:
            results.push({ id, success: false, error: '不支持的操作' });
        }
      } catch (error) {
        results.push({
          id,
          success: false,
          error: error instanceof Error ? error.message : '操作失败',
        });
      }
    }

    // 更新统计数据
    await updateStatistics(userId);

    res.json({
      success: true,
      data: results,
      message: '批量操作完成',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   GET /api/mistakes/analyze
 * @desc    分析错题
 * @access  Private
 */
router.get(
  '/analyze/stats',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const userId = req.user!.id;
    const { subject, period = '30' } = req.query; // period in days

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period as string));

    const where: any = {
      userId,
      createdAt: { gte: daysAgo },
    };

    if (subject) {
      where.subject = subject;
    }

    const mistakes = await prisma.mistake.findMany({ where });

    // 统计分析
    const analysis = {
      total: mistakes.length,
      solved: mistakes.filter(m => m.isSolved).length,
      unsolved: mistakes.filter(m => !m.isSolved).length,
      bySubject: {} as Record<string, number>,
      byDifficulty: {} as Record<string, number>,
      byQuestionType: {} as Record<string, number>,
      byMistakeType: {} as Record<string, number>,
    };

    mistakes.forEach(mistake => {
      // 按学科统计
      analysis.bySubject[mistake.subject] = (analysis.bySubject[mistake.subject] || 0) + 1;
      // 按难度统计
      analysis.byDifficulty[mistake.difficulty] = (analysis.byDifficulty[mistake.difficulty] || 0) + 1;
      // 按题型统计
      analysis.byQuestionType[mistake.questionType] = (analysis.byQuestionType[mistake.questionType] || 0) + 1;

      // 按错题类型统计
      const mistakeTypes = JSON.parse(mistake.mistakeType || '[]');
      mistakeTypes.forEach((type: string) => {
        analysis.byMistakeType[type] = (analysis.byMistakeType[type] || 0) + 1;
      });
    });

    res.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString(),
    });
  })
);

// 辅助函数：更新统计数据
async function updateStatistics(userId: string) {
  try {
    const mistakes = await prisma.mistake.findMany({
      where: { userId },
    });

    const totalQuestions = mistakes.length * 2;
    const totalMistakes = mistakes.length;
    const solvedMistakes = mistakes.filter(m => m.isSolved).length;
    const correctRate = totalQuestions > 0 ? (solvedMistakes / totalQuestions) * 100 : 0;

    const existingStats = await prisma.statistics.findFirst({
      where: { userId },
    });

    if (existingStats) {
      await prisma.statistics.update({
        where: { id: existingStats.id },
        data: {
          totalQuestions,
          totalMistakes,
          solvedMistakes,
          correctRate,
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.statistics.create({
        data: {
          userId,
          totalQuestions,
          totalMistakes,
          solvedMistakes,
          correctRate,
          averageTimePerQuestion: 0,
          studyStreak: 0,
          weeklyStudyHours: 0,
          subjectDistribution: '{}',
          difficultyDistribution: '{}',
          recentProgress: '[]',
        },
      });
    }
  } catch (error) {
    console.error('更新统计数据失败:', error);
  }
}

export default router;