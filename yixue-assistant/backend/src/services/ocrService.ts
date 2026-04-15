import axios from 'axios';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { ocrLogger } from '../utils/logger';

// OCR服务接口
interface OCRService {
  recognize(imagePath: string): Promise<OCRResult>;
  analyze(text: string): Promise<OCRAnalysis>;
}

// OCR结果接口
interface OCRResult {
  success: boolean;
  data?: {
    text: string;
    confidence: number;
  };
  error?: string;
}

// OCR分析结果接口
interface OCRAnalysis {
  subject?: string;
  grade?: string;
  questionType?: string;
  question?: string;
  options?: string[];
  answer?: string;
  difficulty?: string;
}

// 百度OCR配置
const BAIDU_CONFIG = {
  app_id: process.env.BAIDU_OCR_APP_ID,
  api_key: process.env.BAIDU_OCR_API_KEY,
  secret_key: process.env.BAIDU_OCR_SECRET_KEY,
  endpoint: 'https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic',
};

// 腾讯OCR配置
const TENCENT_CONFIG = {
  secret_id: process.env.TENCENT_OCR_SECRET_ID,
  secret_key: process.env.TENCENT_OCR_SECRET_KEY,
  endpoint: 'https://ocr.tencentcloudapi.com/',
};

class BaiduOCRService implements OCRService {
  private getAccessToken(): Promise<string> {
    return new Promise((resolve, reject) => {
      axios
        .get(
          `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${BAIDU_CONFIG.api_key}&client_secret=${BAIDU_CONFIG.secret_key}`
        )
        .then((response) => {
          resolve(response.data.access_token);
        })
        .catch((error) => {
          ocrLogger.error('获取百度access_token失败:', error);
          reject(error);
        });
    });
  }

  async recognize(imagePath: string): Promise<OCRResult> {
    try {
      const accessToken = await this.getAccessToken();
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');

      const response = await axios.post(
        `${BAIDU_CONFIG.endpoint}?access_token=${accessToken}`,
        {
          image: base64Image,
          language_type: 'CHN_ENG', // 中英文混合
        }
      );

      const words = response.data.words_result || [];
      const text = words.map((word: any) => word.words).join('\n');
      const confidence = response.data.words_result_num > 0
        ? words.reduce((sum: number, word: any) => sum + word.confidence, 0) / words.length
        : 0;

      ocrLogger.info(`百度OCR识别完成，信心度: ${confidence.toFixed(2)}`);

      return {
        success: true,
        data: {
          text,
          confidence,
        },
      };
    } catch (error) {
      ocrLogger.error('百度OCR识别失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OCR识别失败',
      };
    }
  }

  async analyze(text: string): Promise<OCRAnalysis> {
    // 这里可以添加更复杂的文本分析逻辑
    const analysis: OCRAnalysis = {};

    // 简单的学科识别
    const subjectKeywords = {
      数学: ['数学', '算式', '公式', '方程', '函数', '几何', '代数'],
      物理: ['物理', '力', '运动', '能量', '电', '磁', '热'],
      化学: ['化学', '分子', '原子', '反应', '化合物', '元素'],
      生物: ['生物', '细胞', '基因', 'DNA', '蛋白质', '生态'],
    };

    // 识别学科
    for (const [subject, keywords] of Object.entries(subjectKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        analysis.subject = subject;
        break;
      }
    }

    // 识别题目类型
    if (text.includes('选择题') || /A\.|B\.|C\.|D\./.test(text)) {
      analysis.questionType = '选择题';
    } else if (text.includes('填空题')) {
      analysis.questionType = '填空题';
    } else if (text.includes('解答题') || text.includes('计算题')) {
      analysis.questionType = '解答题';
    }

    // 识别答案
    const answerMatch = text.match(/答案[：:]\s*([A-D]|[a-d]|\d+)/);
    if (answerMatch) {
      analysis.answer = answerMatch[1];
    }

    return analysis;
  }
}

class TencentOCRService implements OCRService {
  async recognize(imagePath: string): Promise<OCRResult> {
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');

      const response = await axios.post(TENCENT_CONFIG.endpoint, {
        Actions: ['GeneralBasicOCR'],
        Version: '2018-11-19',
        Area: 'ap-beijing',
        ImageBase64: base64Image,
      });

      const text = response.data.Response.GeneralBasicOCR.TextDetections
        ?.map((item: any) => item.DetectedText)
        .join('\n') || '';

      ocrLogger.info('腾讯OCR识别完成');

      return {
        success: true,
        data: {
          text,
          confidence: 0.8, // 腾讯OCR不直接返回信心度
        },
      };
    } catch (error) {
      ocrLogger.error('腾讯OCR识别失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OCR识别失败',
      };
    }
  }

  async analyze(text: string): Promise<OCRAnalysis> {
    // 实现与百度OCR相同的分析逻辑
    const analysis: OCRAnalysis = {};

    // 学科识别逻辑（与百度相同）
    const subjectKeywords = {
      数学: ['数学', '算式', '公式', '方程', '函数', '几何', '代数'],
      物理: ['物理', '力', '运动', '能量', '电', '磁', '热'],
      化学: ['化学', '分子', '原子', '反应', '化合物', '元素'],
      生物: ['生物', '细胞', '基因', 'DNA', '蛋白质', '生态'],
    };

    for (const [subject, keywords] of Object.entries(subjectKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        analysis.subject = subject;
        break;
      }
    }

    if (text.includes('选择题') || /A\.|B\.|C\.|D\./.test(text)) {
      analysis.questionType = '选择题';
    } else if (text.includes('填空题')) {
      analysis.questionType = '填空题';
    } else if (text.includes('解答题') || text.includes('计算题')) {
      analysis.questionType = '解答题';
    }

    const answerMatch = text.match(/答案[：:]\s*([A-D]|[a-d]|\d+)/);
    if (answerMatch) {
      analysis.answer = answerMatch[1];
    }

    return analysis;
  }
}

// 图片预处理
export class ImagePreprocessor {
  static async validateAndOptimize(imagePath: string): Promise<string> {
    try {
      const metadata = await sharp(imagePath).metadata();

      // 检查图片格式
      const allowedFormats = ['jpg', 'jpeg', 'png'];
      if (!metadata.format || !allowedFormats.includes(metadata.format)) {
        throw new Error('不支持的图片格式');
      }

      // 检查图片大小
      const stats = fs.statSync(imagePath);
      if (stats.size > 10 * 1024 * 1024) { // 10MB
        throw new Error('图片大小超过限制');
      }

      // 优化图片
      const optimizedPath = path.join(
        path.dirname(imagePath),
        `optimized_${path.basename(imagePath)}`
      );

      await sharp(imagePath)
        .resize({ width: 2000, height: 2000, fit: 'inside' })
        .quality(90)
        .toFile(optimizedPath);

      return optimizedPath;
    } catch (error) {
      throw new Error(`图片预处理失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  static async cropQuestionArea(imagePath: string): Promise<string> {
    try {
      // 这里可以实现自动裁剪题目区域的逻辑
      // 暂时返回原路径
      const croppedPath = path.join(
        path.dirname(imagePath),
        `cropped_${path.basename(imagePath)}`
      );

      await sharp(imagePath)
        .extract({
          left: 50,
          top: 100,
          width: 900,
          height: 600,
        })
        .toFile(croppedPath);

      return croppedPath;
    } catch (error) {
      throw new Error(`裁剪失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
}

// OCR服务工厂
export class OCRServiceFactory {
  static create(service: 'baidu' | 'tencent' = 'baidu'): OCRService {
    switch (service) {
      case 'baidu':
        return new BaiduOCRService();
      case 'tencent':
        return new TencentOCRService();
      default:
        throw new Error('不支持的OCR服务');
    }
  }

  static getBestService(): 'baidu' | 'tencent' {
    // 根据配置返回可用的OCR服务
    if (BAIDU_CONFIG.app_id && BAIDU_CONFIG.api_key && BAIDU_CONFIG.secret_key) {
      return 'baidu';
    }
    if (TENCENT_CONFIG.secret_id && TENCENT_CONFIG.secret_key) {
      return 'tencent';
    }
    throw new Error('没有配置可用的OCR服务');
  }
}

// 统一的OCR服务
export class UnifiedOCRService {
  private ocrService: OCRService;

  constructor(service?: 'baidu' | 'tencent') {
    this.ocrService = OCRServiceFactory.create(service || OCRServiceFactory.getBestService());
  }

  async recognizeImage(imagePath: string): Promise<OCRResult> {
    try {
      // 预处理图片
      const optimizedPath = await ImagePreprocessor.validateAndOptimize(imagePath);

      // 识别图片
      const result = await this.ocrService.recognize(optimizedPath);

      // 清理临时文件
      fs.unlinkSync(optimizedPath);

      return result;
    } catch (error) {
      throw new Error(`图片识别失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  async analyzeText(text: string): Promise<OCRAnalysis> {
    return await this.ocrService.analyze(text);
  }

  async processMistake(imagePath: string): Promise<{
    text: string;
    analysis: OCRAnalysis;
    confidence: number;
  }> {
    const result = await this.recognizeImage(imagePath);

    if (!result.success || !result.data) {
      throw new Error(result.error || 'OCR识别失败');
    }

    const analysis = await this.analyzeText(result.data.text);

    return {
      text: result.data.text,
      analysis,
      confidence: result.data.confidence,
    };
  }
}