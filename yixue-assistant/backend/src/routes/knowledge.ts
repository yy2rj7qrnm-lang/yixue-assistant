import express from 'express';
import { prisma } from '../database/prisma';
import { createError, asyncHandler, AuthRequest } from '../middleware/errorHandler';

const router = express.Router();

/**
 * @route   GET /api/knowledge
 * @desc    获取知识点列表
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
      sortBy = 'masteryLevel',
      sortOrder = 'asc',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    // 构建查询条件
    const where: any = {};

    if (subject) {
      where.subject = subject;
    }
    if (grade) {
      where.grade = grade;
    }

    const skip = (pageNum - 1) * limitNum;

    // 查询知识点
    const [knowledgePoints, total] = await Promise.all([
      prisma.knowledgePoint.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          [sortBy as string]: sortOrder,
        },
      }),
      prisma.knowledgePoint.count({ where }),
    ]);

    res.json({
      success: true,
      data: knowledgePoints,
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
 * @route   GET /api/knowledge/:id
 * @desc    获取知识点详情
 * @access  Private
 */
router.get(
  '/:id',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const { id } = req.params;

    const knowledgePoint = await prisma.knowledgePoint.findUnique({
      where: { id },
    });

    if (!knowledgePoint) {
      throw createError('知识点不存在', 404);
    }

    res.json({
      success: true,
      data: knowledgePoint,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   POST /api/knowledge/:id/mastery
 * @desc    更新知识点掌握度
 * @access  Private
 */
router.post(
  '/:id/mastery',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const { id } = req.params;
    const { masteryLevel } = req.body;

    if (masteryLevel === undefined || masteryLevel < 0 || masteryLevel > 100) {
      throw createError('掌握度必须在0-100之间', 400);
    }

    const knowledgePoint = await prisma.knowledgePoint.update({
      where: { id },
      data: { masteryLevel },
    });

    res.json({
      success: true,
      data: knowledgePoint,
      message: '掌握度更新成功',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   GET /api/knowledge/related
 * @desc    获取相关知识点
 * @access  Private
 */
router.get(
  '/related',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const { knowledgeId, limit = 5 } = req.query;

    if (!knowledgeId) {
      throw createError('请提供知识点ID', 400);
    }

    const knowledgePoint = await prisma.knowledgePoint.findUnique({
      where: { id: knowledgeId as string },
    });

    if (!knowledgePoint) {
      throw createError('知识点不存在', 404);
    }

    // 获取相关知识点（同章节、同难度）
    const relatedPoints = await prisma.knowledgePoint.findMany({
      where: {
        id: { not: knowledgeId as string },
        subject: knowledgePoint.subject,
        grade: knowledgePoint.grade,
        chapter: knowledgePoint.chapter,
      },
      take: parseInt(limit as string),
      orderBy: { masteryLevel: 'asc' },
    });

    res.json({
      success: true,
      data: relatedPoints,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;