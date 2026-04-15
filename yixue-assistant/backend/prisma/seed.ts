import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始种子数据填充...');

  // 清除现有数据
  await prisma.mistake.deleteMany();
  await prisma.questionAttempt.deleteMany();
  await prisma.question.deleteMany();
  await prisma.knowledgePoint.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.report.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ 清除现有数据完成');

  // 创建测试用户
  const hashedPassword = await bcrypt.hash('password123', 10);
  const testUsers = await Promise.all([
    prisma.user.create({
      data: {
        name: '张三',
        email: 'zhangsan@example.com',
        password: hashedPassword,
        grade: 'GRADE_10',
        subject: 'MATH',
      },
    }),
    prisma.user.create({
      data: {
        name: '李四',
        email: 'lisi@example.com',
        password: hashedPassword,
        grade: 'GRADE_11',
        subject: 'PHYSICS',
      }),
  ]);

  console.log('✅ 创建测试用户完成');

  // 创建知识点
  const knowledgePoints = await Promise.all([
    prisma.knowledgePoint.create({
      data: {
        name: '一元二次方程',
        subject: 'MATH',
        grade: 'GRADE_10',
        chapter: '代数',
        description: '一元二次方程的解法与应用',
        masteryLevel: 60,
      },
    }),
    prisma.knowledgePoint.create({
      data: {
        name: '牛顿运动定律',
        subject: 'PHYSICS',
        grade: 'GRADE_10',
        chapter: '力学',
        description: '牛顿第一、第二、第三定律',
        masteryLevel: 45,
      },
    }),
    prisma.knowledgePoint.create({
      data: {
        name: '函数的概念',
        subject: 'MATH',
        grade: 'GRADE_10',
        chapter: '函数',
        description: '函数的定义、表示方法和性质',
        masteryLevel: 70,
      },
    }),
  ]);

  console.log('✅ 创建知识点完成');

  // 创建题库
  const questions = await Promise.all([
    prisma.question.create({
      data: {
        subject: 'MATH',
        grade: 'GRADE_10',
        chapter: '代数',
        difficulty: 'EASY',
        questionType: '计算题',
        content: '求解方程 x² - 5x + 6 = 0',
        options: ['x=2, x=3', 'x=-2, x=-3', 'x=1, x=6', 'x=-1, x=-6'],
        correctAnswer: 'x=2, x=3',
        analysis: '使用因式分解法：x² - 5x + 6 = (x-2)(x-3) = 0，所以x=2或x=3',
        knowledgePoints: ['一元二次方程', '因式分解'],
      },
    }),
    prisma.question.create({
      data: {
        subject: 'PHYSICS',
        grade: 'GRADE_10',
        chapter: '力学',
        difficulty: 'MEDIUM',
        questionType: '计算题',
        content: '一个质量为2kg的物体在水平面上受到10N的推力，加速度是多少？',
        options: ['2 m/s²', '5 m/s²', '10 m/s²', '20 m/s²'],
        correctAnswer: '5 m/s²',
        analysis: '根据牛顿第二定律 F=ma，a=F/m=10/2=5 m/s²',
        knowledgePoints: ['牛顿第二定律', '加速度'],
      },
    }),
    prisma.question.create({
      data: {
        subject: 'MATH',
        grade: 'GRADE_10',
        chapter: '函数',
        difficulty: 'MEDIUM',
        questionType: '应用题',
        content: '已知函数 f(x) = 2x + 3，求 f(5) 的值',
        options: ['10', '12', '13', '15'],
        correctAnswer: '13',
        analysis: 'f(5) = 2×5 + 3 = 10 + 3 = 13',
        knowledgePoints: ['函数的概念', '函数求值'],
      },
    }),
    prisma.question.create({
      data: {
        subject: 'MATH',
        grade: 'GRADE_10',
        chapter: '代数',
        difficulty: 'HARD',
        questionType: '证明题',
        content: '证明：对于任意实数a和b，有 a² + b² ≥ 2ab',
        options: ['正确', '错误', '无法判断', '部分正确'],
        correctAnswer: '正确',
        analysis: '因为 (a-b)² ≥ 0，展开得 a² - 2ab + b² ≥ 0，即 a² + b² ≥ 2ab',
        knowledgePoints: ['不等式', '完全平方'],
      },
    }),
    prisma.question.create({
      data: {
        subject: 'PHYSICS',
        grade: 'GRADE_10',
        chapter: '力学',
        difficulty: 'EASY',
        questionType: '选择题',
        content: '力的国际单位是',
        options: ['牛顿', '焦耳', '瓦特', '帕斯卡'],
        correctAnswer: '牛顿',
        analysis: '力的国际单位是牛顿，简称牛，符号为N',
        knowledgePoints: ['力的单位', '力学基础'],
      },
    }),
  ]);

  console.log('✅ 创建题库完成');

  // 创建错题
  const mistakes = await Promise.all([
    prisma.mistake.create({
      data: {
        userId: testUsers[0].id,
        subject: 'MATH',
        grade: 'GRADE_10',
        chapter: '代数',
        difficulty: 'MEDIUM',
        questionType: '计算题',
        questionText: '求解方程 x² - 7x + 12 = 0',
        questionImage: '',
        answer: 'x=3, x=4',
        correctAnswer: 'x=3, x=4',
        analysis: '使用因式分解法：x² - 7x + 12 = (x-3)(x-4) = 0，所以x=3或x=4',
        knowledgePoints: JSON.stringify(['一元二次方程']),
        mistakeType: JSON.stringify(['calculation_error']),
        isSolved: false,
        reviewCount: 0,
      },
    }),
    prisma.mistake.create({
      data: {
        userId: testUsers[0].id,
        subject: 'PHYSICS',
        grade: 'GRADE_10',
        chapter: '力学',
        difficulty: 'MEDIUM',
        questionType: '计算题',
        questionText: '一个质量为5kg的物体在水平面上受到20N的推力，加速度是多少？',
        questionImage: '',
        answer: '4 m/s²',
        correctAnswer: '4 m/s²',
        analysis: '根据牛顿第二定律 F=ma，a=F/m=20/5=4 m/s²',
        knowledgePoints: JSON.stringify(['牛顿第二定律', '加速度']),
        mistakeType: JSON.stringify(['concept_error']),
        isSolved: true,
        reviewCount: 3,
        mastery: 80,
      },
    }),
  ]);

  console.log('✅ 创建错题完成');

  // 创建学习推荐
  const recommendations = await Promise.all([
    prisma.recommendation.create({
      data: {
        userId: testUsers[0].id,
        type: 'question',
        targetId: questions[1].id,
        priority: 8,
        reason: '建议练习更多物理力学题目',
        isCompleted: false,
      },
    }),
    prisma.recommendation.create({
      data: {
        userId: testUsers[0].id,
        type: 'knowledge',
        targetId: knowledgePoints[1].id,
        priority: 9,
        reason: '牛顿运动定律掌握度较低，需要加强',
        isCompleted: false,
      },
    }),
  ]);

  console.log('✅ 创建学习推荐完成');

  // 创建学习报告
  await prisma.report.create({
    data: {
      userId: testUsers[0].id,
      reportType: 'weekly',
      startDate: new Date('2026-04-08'),
      endDate: new Date('2026-04-14'),
      data: JSON.stringify({
        studyTime: 12.5,
        questionsAttempted: 45,
        correctRate: 78.5,
        mistakesSolved: 12,
        subjectBreakdown: {
          MATH: { attempted: 25, correct: 20, rate: 80 },
          PHYSICS: { attempted: 20, correct: 15, rate: 75 },
        },
      }),
    },
  });

  console.log('✅ 创建学习报告完成');

  console.log('🎉 种子数据填充完成！');
  console.log('');
  console.log('测试账号信息：');
  console.log('账号1: zhangsan@example.com / password123');
  console.log('账号2: lisi@example.com / password123');
}

main()
  .catch((e) => {
    console.error('种子数据填充失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
