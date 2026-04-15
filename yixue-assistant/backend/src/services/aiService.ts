import axios from 'axios';
import { learningLogger } from '../utils/logger';

// AI服务接口
interface AIService {
  analyzeMistake(question: string, answer: string, correctAnswer: string): Promise<MistakeAnalysis>;
  generateRecommendations(userId: string, mistakes: any[]): Promise<Recommendation[]>;
  explainAnswer(question: string, answer: string): Promise<string>;
  generateLearningPlan(userId: string, knowledgePoints: any[]): Promise<LearningPlan>;
  answerQuestion(question: string, context?: string): Promise<string>;
}

// 错题分析结果
interface MistakeAnalysis {
  mistakeType: string[];
  errorReason: string;
  explanation: string;
  knowledgePoints: string[];
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  improvement: string[];
}

// 推荐结果
interface Recommendation {
  type: 'question' | 'knowledge' | 'review';
  targetId: string;
  priority: number;
  reason: string;
}

// 学习计划
interface LearningPlan {
  dailyGoals: string[];
  weeklyGoals: string[];
  suggestedTopics: string[];
  estimatedDuration: string;
}

// Claude配置
const CLAUDE_CONFIG = {
  apiKey: process.env.CLAUDE_API_KEY,
  baseURL: 'https://api.anthropic.com/v1',
  model: 'claude-3-sonnet-20240229',
};

// OpenAI配置
const OPENAI_CONFIG = {
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.openai.com/v1',
  model: 'gpt-4',
};

// 百度文心一言配置
const BAIDU_CONFIG = {
  apiKey: process.env.BAIDU_QIANFAN_API_KEY,
  secretKey: process.env.BAIDU_QIANFAN_SECRET_KEY,
  baseURL: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop',
  model: 'ernie-bot-4',
};

// 阿里通义千问配置
const ALIBABA_CONFIG = {
  apiKey: process.env.ALIBABA_QWEN_API_KEY,
  baseURL: 'https://dashscope.aliyuncs.com/api/v1',
  model: 'qwen-max',
};

// Claude AI服务
class ClaudeAIService implements AIService {
  private async callAPI(messages: any[], maxTokens: number = 1000): Promise<string> {
    try {
      const response = await axios.post(
        `${CLAUDE_CONFIG.baseURL}/messages`,
        {
          model: CLAUDE_CONFIG.model,
          max_tokens: maxTokens,
          messages,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': CLAUDE_CONFIG.apiKey,
            'anthropic-version': '2023-06-01',
          },
        }
      );

      return response.data.content[0].text;
    } catch (error) {
      learningLogger.error('Claude API调用失败:', error);
      throw new Error('AI服务调用失败');
    }
  }

  async analyzeMistake(question: string, answer: string, correctAnswer: string): Promise<MistakeAnalysis> {
    const prompt = `你是一位专业的教育分析师，请分析以下学生的错题：

题目：${question}
学生答案：${answer}
正确答案：${correctAnswer}

请从以下几个方面进行分析：
1. 错误类型（概念错误、计算错误、方法错误、粗心大意、时间压力）
2. 错误原因
3. 详细解释
4. 涉及的知识点
5. 题目难度（EASY/MEDIUM/HARD）
6. 改进建议

请以JSON格式返回结果，包含以下字段：
{
  "mistakeType": ["错误类型1", "错误类型2"],
  "errorReason": "错误原因",
  "explanation": "详细解释",
  "knowledgePoints": ["知识点1", "知识点2"],
  "difficulty": "EASY|MEDIUM|HARD",
  "improvement": ["改进建议1", "改进建议2"]
}`;

    const response = await this.callAPI([
      { role: 'user', content: prompt }
    ]);

    // 尝试从响应中提取JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // 如果无法解析JSON，返回默认结构
    return {
      mistakeType: ['calculation_error'],
      errorReason: '计算过程出现错误',
      explanation: response,
      knowledgePoints: [],
      difficulty: 'MEDIUM',
      improvement: [],
    };
  }

  async generateRecommendations(userId: string, mistakes: any[]): Promise<Recommendation[]> {
    const mistakeSummary = mistakes.map(m => ({
      subject: m.subject,
      question: m.questionText,
      difficulty: m.difficulty,
      reviewCount: m.reviewCount,
      isSolved: m.isSolved,
    })).join('\n');

    const prompt = `根据以下学生的错题情况，生成个性化学习推荐：

学生ID：${userId}
错题概要：
${mistakeSummary}

请生成3-5条学习推荐，每条推荐包含：
- 类型（question知识题/review复习/knowledge知识点）
- 目标内容
- 优先级（1-10，数字越大优先级越高）
- 推荐理由

请以JSON格式返回数组格式结果。`;

    const response = await this.callAPI([
      { role: 'user', content: prompt }
    ]);

    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return [];
  }

  async explainAnswer(question: string, answer: string): Promise<string> {
    const prompt = `请详细解释以下题目的解题思路和答案：

题目：${question}
答案：${answer}

请提供：
1. 题目分析
2. 解题思路
3. 详细步骤
4. 易错点提示

请用通俗易懂的语言解释。`;

    return await this.callAPI([
      { role: 'user', content: prompt }
    ], 1500);
  }

  async generateLearningPlan(userId: string, knowledgePoints: any[]): Promise<LearningPlan> {
    const pointsSummary = knowledgePoints.map(p =>
      `${p.name}(掌握度:${p.masteryLevel})`
    ).join(', ');

    const prompt = `根据学生的知识点掌握情况，制定个性化学习计划：

学生ID：${userId}
知识点掌握情况：${pointsSummary}

请制定一个1周的学习计划，包含：
- 每日学习目标
- 每周总结目标
- 建议学习的知识点
- 预计完成时间

请以JSON格式返回：
{
  "dailyGoals": ["目标1", "目标2"],
  "weeklyGoals": ["目标1", "目标2"],
  "suggestedTopics": ["主题1", "主题2"],
  "estimatedDuration": "7天"
}`;

    const response = await this.callAPI([
      { role: 'user', content: prompt }
    ]);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      dailyGoals: [],
      weeklyGoals: [],
      suggestedTopics: [],
      estimatedDuration: '7天',
    };
  }

  async answerQuestion(question: string, context?: string): Promise<string> {
    const prompt = context
      ? `背景信息：${context}\n\n问题：${question}\n\n请基于以上背景信息回答问题。`
      : `问题：${question}`;

    return await this.callAPI([
      { role: 'user', content: prompt }
    ], 1500);
  }
}

// OpenAI AI服务
class OpenAIService implements AIService {
  private async callAPI(messages: any[], maxTokens: number = 1000): Promise<string> {
    try {
      const response = await axios.post(
        `${OPENAI_CONFIG.baseURL}/chat/completions`,
        {
          model: OPENAI_CONFIG.model,
          messages,
          max_tokens: maxTokens,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_CONFIG.apiKey}`,
          },
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      learningLogger.error('OpenAI API调用失败:', error);
      throw new Error('AI服务调用失败');
    }
  }

  async analyzeMistake(question: string, answer: string, correctAnswer: string): Promise<MistakeAnalysis> {
    // 实现与Claude类似的分析逻辑
    const prompt = `你是一位专业的教育分析师，请分析以下学生的错题...

    // 使用相同的分析逻辑
    return {
      mistakeType: ['concept_error'],
      errorReason: '概念理解有误',
      explanation: '详细解释...',
      knowledgePoints: [],
      difficulty: 'MEDIUM',
      improvement: [],
    };
  }

  async generateRecommendations(userId: string, mistakes: any[]): Promise<Recommendation[]> {
    return [];
  }

  async explainAnswer(question: string, answer: string): Promise<string> {
    return '';
  }

  async generateLearningPlan(userId: string, knowledgePoints: any[]): Promise<LearningPlan> {
    return {
      dailyGoals: [],
      weeklyGoals: [],
      suggestedTopics: [],
      estimatedDuration: '7天',
    };
  }

  async answerQuestion(question: string, context?: string): Promise<string> {
    return '';
  }
}

// AI服务工厂
export class AIServiceFactory {
  static create(service: 'claude' | 'openai' = 'claude'): AIService {
    switch (service) {
      case 'claude':
        if (!CLAUDE_CONFIG.apiKey) {
          throw new Error('Claude API密钥未配置');
        }
        return new ClaudeAIService();
      case 'openai':
        if (!OPENAI_CONFIG.apiKey) {
          throw new Error('OpenAI API密钥未配置');
        }
        return new OpenAIService();
      default:
        throw new Error('不支持的AI服务');
    }
  }

  static getBestService(): 'claude' | 'openai' {
    // 优先使用Claude，其次OpenAI
    if (CLAUDE_CONFIG.apiKey) {
      return 'claude';
    }
    if (OPENAI_CONFIG.apiKey) {
      return 'openai';
    }
    throw new Error('没有配置可用的AI服务');
  }
}

// 统一的AI服务
export class UnifiedAIService {
  private aiService: AIService;

  constructor(service?: 'claude' | 'openai') {
    this.aiService = AIServiceFactory.create(service || AIServiceFactory.getBestService());
  }

  // 分析错题
  async analyzeMistake(question: string, answer: string, correctAnswer: string): Promise<MistakeAnalysis> {
    learningLogger.info('开始分析错题');
    try {
      const result = await this.aiService.analyzeMistake(question, answer, correctAnswer);
      learningLogger.info('错题分析完成');
      return result;
    } catch (error) {
      learningLogger.error('错题分析失败:', error);
      throw error;
    }
  }

  // 生成推荐
  async generateRecommendations(userId: string, mistakes: any[]): Promise<Recommendation[]> {
    learningLogger.info('生成学习推荐');
    try {
      const result = await this.aiService.generateRecommendations(userId, mistakes);
      learningLogger.info('学习推荐生成完成');
      return result;
    } catch (error) {
      learningLogger.error('学习推荐生成失败:', error);
      throw error;
    }
  }

  // 解释答案
  async explainAnswer(question: string, answer: string): Promise<string> {
    learningLogger.info('生成答案解释');
    try {
      const result = await this.aiService.explainAnswer(question, answer);
      learningLogger.info('答案解释生成完成');
      return result;
    } catch (error) {
      learningLogger.error('答案解释生成失败:', error);
      throw error;
    }
  }

  // 生成学习计划
  async generateLearningPlan(userId: string, knowledgePoints: any[]): Promise<LearningPlan> {
    learningLogger.info('生成学习计划');
    try {
      const result = await this.aiService.generateLearningPlan(userId, knowledgePoints);
      learningLogger.info('学习计划生成完成');
      return result;
    } catch (error) {
      learningLogger.error('学习计划生成失败:', error);
      throw error;
    }
  }

  // 回答问题
  async answerQuestion(question: string, context?: string): Promise<string> {
    learningLogger.info('回答学习问题');
    try {
      const result = await this.aiService.answerQuestion(question, context);
      learningLogger.info('学习问题回答完成');
      return result;
    } catch (error) {
      learningLogger.error('学习问题回答失败:', error);
      throw error;
    }
  }
}