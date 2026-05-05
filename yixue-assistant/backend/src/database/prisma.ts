import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// 数据库连接事件
prisma.$on('query', (e) => {
  logger.debug(`数据库查询: ${e.query}`);
  logger.debug(`参数: ${e.params}`);
  logger.debug(`执行时间: ${e.duration}ms`);
});

prisma.$on('error', (e) => {
  logger.error(`数据库错误: ${e}`);
});

prisma.$on('info', (e) => {
  logger.info(`数据库信息: ${e}`);
});

prisma.$on('warn', (e) => {
  logger.warn(`数据库警告: ${e}`);
});

// 测试数据库连接
async function testConnection() {
  try {
    await prisma.$connect();
    logger.info('✅ 数据库连接成功');
  } catch (error) {
    logger.error('❌ 数据库连接失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
async function gracefulShutdown() {
  await prisma.$disconnect();
  logger.info('数据库连接已关闭');
  process.exit(0);
}

process.on('beforeExit', gracefulShutdown);
process.on('SIGINT', async () => {
  await gracefulShutdown();
});
process.on('SIGTERM', async () => {
  await gracefulShutdown();
});

export { prisma, testConnection };