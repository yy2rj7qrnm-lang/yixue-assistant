import express from 'express';
import { createError, asyncHandler, AuthRequest } from '../middleware/errorHandler';
import { UnifiedAIService } from '../services/aiService';
import { prisma } from '../database/prisma';

const router = express.Router();

/**
 * @route   POST /api/ai/analyze-mistake
 * @desc    AI分析错题
 * @access  Private
 */
router.post(
  '/analyze-mistake',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const { question, answer, correctAnswer } = req.body;

    // 验证必填字段
    if (!question || !correctAnswer) {
      throw createError('请提供题目和正确答案', 400);
    }

    try {
      const aiService = new UnifiedAIService();
      const analysis = await aiService.analyzeMistake(question, answer || '', correctAnswer);

      res.json({
        success: true,
        data: analysis,
        message: '错题分析完成',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      throw createError('错题分析失败，请稍后重试', 500);
    }
  })
);

/**
 * @route   POST /api/ai/explain-answer
 * @desc    AI解释答案
 * @access  Private
 */
router.post(
  '/explain-answer',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const { question, answer } = req.body;

    // 验证必填字段
    if (!question || !answer) {
      throw createError('请提供题目和答案', 400);
    }

    try {
      const aiService = new UnifiedAIService();
      const explanation = await aiService.explainAnswer(question, answer);

      res.json({
        success: true,
        data: { explanation },
        message: '答案解释完成',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      throw createError('答案解释失败，请稍后重试', 500);
    }
  })
);

/**
 * @route   POST /api/ai/generate-recommendations
 * @desc    AI生成学习推荐
 * @access  Private
 */
router.post(
  '/generate-recommendations',
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

    try {
      const aiService = new UnifiedAIService();
      const recommendations = await aiService.generateRecommendations(userId, mistakes);

      // 保存推荐到数据库
      for (const rec of recommendations) {
        await prisma.recommendation.create({
          data: {
            userId,
            type: rec.type as any,
            targetId: rec.targetId,
            priority: rec.priority,
            reason: rec.reason,
          },
        });
      }

      res.json({
        success: true,
        data: recommendations,
        message: '学习推荐生成完成',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      throw createError('学习推荐生成失败，请稍后重试', 500);
    }
  })
);

/**
 * @route   POST /api/ai/generate-learning-plan
 * @desc    AI生成学习计划
 * @access  Private
 */
router.post(
  '/generate-learning-plan',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const userId = req.user!.id;

    // 获取用户知识点掌握情况
    const knowledgePoints = await prisma.knowledgePoint.findMany({
      where: {
        userId, // 假设有userId关联
      },
      orderBy: { masteryLevel: 'asc' },
      take: 10,
    });

    if (knowledgePoints.length === 0) {
      return res.json({
        success: true,
        data: {
          dailyGoals: ['完成5道练习题', '复习2个错题'],
          weeklyGoals: ['完成30道练习题', '掌握3个新知识点'],
          suggestedTopics: ['基础计算', '概念理解', '应用题'],
          estimatedDuration: '7天',
        },
        message: '基于默认计划生成',
        timestamp: new Date().toISOString(),
      });
    }

    try {
      const aiService = new UnifiedAIService();
      const plan = await aiService.generateLearningPlan(userId, knowledgePoints);

      res.json({
        success: true,
        data: plan,
        message: '学习计划生成完成',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      throw createError('学习计划生成失败，请稍后重试', 500);
    }
  })
);

/**
 * @route   POST /api/ai/ask-question
 * @desc    AI问答
 * @access  Private
 */
router.post(
  '/ask-question',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const { question, context } = req.body;

    // 验证必填字段
    if (!question) {
      throw createError('请提供问题', 400);
    }

    // 限制问题长度
    if (question.length > 500) {
      throw createError('问题过长，请控制在500字以内', 400);
    }

    try {
      const aiService = new UnifiedAIService();
      const answer = await aiService.answerQuestion(question, context);

      res.json({
        success: true,
        data: { answer },
        message: '问题回答完成',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      throw createError('问题回答失败，请稍后重试', 500);
    }
  })
);

/**
 * @route   GET /api/ai/services
 * @desc    获取可用的AI服务
 * @access  Private
 */
router.get(
  '/services',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const services = [
      {
        id: 'claude',
        name: 'Claude',
        provider: 'Anthropic',
        available: !!process.env.CLAUDE_API_KEY,
        description: 'Anthropic的Claude大语言模型，擅长分析和推理',
      },
      {
        id: 'openai',
        name: 'GPT-4',
        provider: 'OpenAI',
        available: !!process.env.OPENAI_API_KEY,
        description: 'OpenAI的GPT-4大语言模型，通用能力强',
      },
    ];

    res.json({
      success: true,
      data: services,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;