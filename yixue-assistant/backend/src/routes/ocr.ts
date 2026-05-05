import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../database/prisma';
import { createError, asyncHandler, AuthRequest } from '../middleware/errorHandler';
import { UnifiedOCRService } from '../services/ocrService';

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('只支持 JPG、PNG、WebP 格式的图片'));
    }
    cb(null, true);
  },
});

/**
 * @route   POST /api/ocr/recognize
 * @desc    识别错题图片
 * @access  Private
 */
router.post(
  '/recognize',
  upload.single('image'),
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    if (!req.file) {
      throw createError('请上传图片', 400);
    }

    const userId = req.user!.id;
    const imagePath = req.file.path;

    try {
      // 创建OCR服务实例
      const ocrService = new UnifiedOCRService();

      // 处理错题
      const result = await ocrService.processMistake(imagePath);

      res.json({
        success: true,
        data: {
          text: result.text,
          analysis: result.analysis,
          confidence: result.confidence,
          imagePath: req.file.filename,
        },
        message: '识别成功',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // 清理上传的文件
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
      throw error;
    }
  })
);

/**
 * @route   POST /api/ocr/analyze
 * @desc    分析错题文本并保存
 * @access  Private
 */
router.post(
  '/analyze',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const userId = req.user!.id;
    const {
      text,
      imagePath,
      correctAnswer,
      subject,
      grade,
      chapter,
      questionType,
      knowledgePoints,
    } = req.body;

    // 验证必填字段
    if (!text || !correctAnswer) {
      throw createError('请提供完整的错题信息', 400);
    }

    // 创建错题
    const mistake = await prisma.mistake.create({
      data: {
        userId,
        questionImage: imagePath || '',
        questionText: text,
        answer: '', // 学生的答案（从文本中提取）
        correctAnswer,
        subject: subject || 'MATH',
        grade: grade || 'GRADE_10',
        chapter: chapter || '未分类',
        questionType: questionType || 'SHORT_ANSWER',
        difficulty: 'MEDIUM',
        analysis: '', // 可以从AI服务获取
        knowledgePoints: JSON.stringify(knowledgePoints || []),
        mistakeType: JSON.stringify([]),
      },
    });

    // 初始化统计数据
    await updateStatistics(userId);

    res.json({
      success: true,
      data: mistake,
      message: '错题保存成功',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   GET /api/ocr/mistake-types
 * @desc    获取错题类型列表
 * @access  Private
 */
router.get(
  '/mistake-types',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const mistakeTypes = [
      { value: 'concept_error', label: '概念错误', description: '对概念理解不清或混淆' },
      { value: 'calculation_error', label: '计算错误', description: '计算过程中的失误' },
      { value: 'method_error', label: '方法错误', description: '解题方法不当' },
      { value: 'careless_mistake', label: '粗心大意', description: '审题或计算疏忽' },
      { value: 'time_pressure', label: '时间压力', description: '时间不够导致的错误' },
    ];

    res.json({
      success: true,
      data: mistakeTypes,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   GET /api/ocr/subjects
 * @desc    获取学科列表
 * @access  Private
 */
router.get(
  '/subjects',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const subjects = [
      { value: 'MATH', label: '数学' },
      { value: 'CHINESE', label: '语文' },
      { value: 'ENGLISH', label: '英语' },
      { value: 'PHYSICS', label: '物理' },
      { value: 'CHEMISTRY', label: '化学' },
      { value: 'BIOLOGY', label: '生物' },
    ];

    res.json({
      success: true,
      data: subjects,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   GET /api/ocr/grades
 * @desc    获取年级列表
 * @access  Private
 */
router.get(
  '/grades',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const grades = [
      { value: 'GRADE_7', label: '七年级' },
      { value: 'GRADE_8', label: '八年级' },
      { value: 'GRADE_9', label: '九年级' },
      { value: 'GRADE_10', label: '高一' },
      { value: 'GRADE_11', label: '高二' },
      { value: 'GRADE_12', label: '高三' },
    ];

    res.json({
      success: true,
      data: grades,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   GET /api/ocr/question-types
 * @desc    获取题目类型列表
 * @access  Private
 */
router.get(
  '/question-types',
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const questionTypes = [
      { value: 'SINGLE_CHOICE', label: '单选题' },
      { value: 'MULTIPLE_CHOICE', label: '多选题' },
      { value: 'TRUE_FALSE', label: '判断题' },
      { value: 'FILL_BLANK', label: '填空题' },
      { value: 'SHORT_ANSWER', label: '简答题' },
      { value: 'ESSAY', label: '论述题' },
    ];

    res.json({
      success: true,
      data: questionTypes,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route   POST /api/ocr/batch
 * @desc    批量识别错题
 * @access  Private
 */
router.post(
  '/batch',
  upload.array('images', 10),
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const userId = req.user!.id;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      throw createError('请上传图片', 400);
    }

    const results = [];
    const ocrService = new UnifiedOCRService();

    for (const file of files) {
      try {
        const result = await ocrService.processMistake(file.path);
        results.push({
          filename: file.filename,
          success: true,
          ...result,
        });
      } catch (error) {
        results.push({
          filename: file.filename,
          success: false,
          error: error instanceof Error ? error.message : '识别失败',
        });
      }
    }

    res.json({
      success: true,
      data: results,
      message: `批量识别完成，成功${results.filter(r => r.success).length}/${results.length}`,
      timestamp: new Date().toISOString(),
    });
  })
);

// 辅助函数：更新统计数据
async function updateStatistics(userId: string) {
  try {
    // 获取用户所有错题
    const mistakes = await prisma.mistake.findMany({
      where: { userId },
    });

    const totalQuestions = mistakes.length * 2; // 假设每个错题有2次尝试
    const totalMistakes = mistakes.length;
    const solvedMistakes = mistakes.filter(m => m.isSolved).length;
    const correctRate = totalQuestions > 0 ? (solvedMistakes / totalQuestions) * 100 : 0;

    // 更新或创建统计数据
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