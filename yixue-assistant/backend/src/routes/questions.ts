import express from 'express';
import { prisma } from '../database/prisma';
import { createError, asyncHandler, AuthRequest } from '../middleware/errorHandler';

const router = express.Router();

/**
 * @route   GET /api/questions
 * @desc    获取题目列表
 * @access  Private
 */
router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const {
      page = 1,
      limit = 20,
      subject,
      grade,
      chapter,
      difficulty,
      questionType,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    // 构建查询条件
    const where: any = { isActive: true };

    if (subject) {
      where.subject = subject;
    }
    if (grade) {
      where.grade = grade;
    }
    if (chapter) {
      where.chapter = chapter;
    }
    if (difficulty) {
      where.difficulty = difficulty;
    }
    if (questionType) {
      where.questionType = questionType;
    }

    const skip = (pageNum - 1) * limitNum;

    // 查询题目
    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          [sortBy as string]: sortOrder,
        },
        select: {
          id: true,
          subject: true,
          grade: true,
          chapter: true,
          difficulty: true,
          questionType: true,
          content: true,
          options: true,
          correctAnswer: true,
          analysis: true,
          knowledgePoints: true,
        },
      }),
      prisma.question.count({ where }),
    ]);

    res.json({
      success: true,
      data: questions,
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
 * @route   GET /api/questions/:id
 * @desc    获取题目详情
 * @access  Private
 */
router.get(
  '/:id',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const { id } = req.params;

    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        attempts: {
          where: { userId: req.user!.id },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!question) {
      throw createError('题目不存在', 404);
    }

    res.json({
      success: true,
      data: question,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   POST /api/questions/:id/attempt
 * @desc    提交题目答案
 * @access  Private
 */
router.post(
  '/:id/attempt',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const { answer, timeSpent } = req.body;

    if (!answer) {
      throw createError('请提供答案', 400);
    }

    // 获取题目
    const question = await prisma.question.findUnique({
      where: { id },
    });

    if (!question) {
      throw createError('题目不存在', 404);
    }

    // 判断答案是否正确
    const isCorrect = answer === question.correctAnswer;

    // 创建尝试记录
    const attempt = await prisma.questionAttempt.create({
      data: {
        userId,
        questionId: id,
        answer,
        isCorrect,
        timeSpent: timeSpent || 0,
      },
    });

    // 如果答错，创建错题记录
    if (!isCorrect) {
      await prisma.mistake.create({
        data: {
          userId,
          subject: question.subject,
          grade: question.grade,
          chapter: question.chapter,
          difficulty: question.difficulty,
          questionType: question.questionType,
          questionText: question.content,
          questionImage: '',
          answer,
          correctAnswer: question.correctAnswer,
          analysis: question.analysis,
          knowledgePoints: JSON.stringify(question.knowledgePoints || []),
          mistakeType: JSON.stringify([]),
        },
      });
    }

    res.json({
      success: true,
      data: {
        attempt,
        isCorrect,
        correctAnswer: question.correctAnswer,
        analysis: isCorrect ? null : question.analysis,
      },
      message: isCorrect ? '回答正确！' : '回答错误',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   GET /api/questions/search
 * @desc    搜索题目
 * @access  Private
 */
router.get(
  '/search',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q) {
      throw createError('请提供搜索关键词', 400);
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // 使用Prisma的contains进行模糊搜索
    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where: {
          content: {
            contains: q as string,
          },
          isActive: true,
        },
        skip,
        take: limitNum,
      }),
      prisma.question.count({
        where: {
          content: {
            contains: q as string,
          },
          isActive: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: questions,
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
 * @route   GET /api/questions/recommend
 * @desc    推荐题目
 * @access  Private
 */
router.get(
  '/recommend',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const userId = req.user!.id;
    const { limit = 10 } = req.query;

    const limitNum = parseInt(limit as string);

    // 获取用户的错题
    const mistakes = await prisma.mistake.findMany({
      where: { userId },
      take: 10,
      select: {
        subject: true,
        grade: true,
        difficulty: true,
        knowledgePoints: true,
      },
    });

    if (mistakes.length === 0) {
      // 如果没有错题，返回随机题目
      const questions = await prisma.question.findMany({
        where: { isActive: true },
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      });

      return res.json({
        success: true,
        data: questions,
        message: '为您推荐一些练习题',
        timestamp: new Date().toISOString(),
      });
    }

    // 分析错题，推荐相关题目
    const subjectDistribution = mistakes.reduce((acc, m) => {
      acc[m.subject] = (acc[m.subject] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 获取错题最多的学科
    const weakSubject = Object.entries(subjectDistribution)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    // 获取相关知识点
    const knowledgePoints = mistakes
      .flatMap(m => {
        try {
          return JSON.parse(m.knowledgePoints || '[]');
        } catch {
          return [];
        }
      })
      .filter((point, index, self) => self.indexOf(point) === index)
      .slice(0, 5);

    // 推荐题目
    const recommendedQuestions = await prisma.question.findMany({
      where: {
        subject: weakSubject,
        isActive: true,
        NOT: {
          attempts: {
            some: {
              userId,
            },
          },
        },
      },
      take: limitNum,
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: recommendedQuestions,
      message: `基于您的${getSubjectLabel(weakSubject)}学习情况为您推荐`,
      timestamp: new Date().toISOString(),
    });
  })
);

// 辅助函数
function getSubjectLabel(subject: string) {
  const labels = {
    MATH: '数学',
    CHINESE: '语文',
    ENGLISH: '英语',
    PHYSICS: '物理',
    CHEMISTRY: '化学',
    BIOLOGY: '生物',
  };
  return labels[subject as keyof typeof labels] || subject;
}

export default router;