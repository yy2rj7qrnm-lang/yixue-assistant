import winston from 'winston';
import path from 'path';

// 定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...(Object.keys(meta).length > 0 && meta),
      ...(stack && { stack }),
    });
  })
);

// 创建logger实例
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'yixue-backend' },
  transports: [
    // 错误日志
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // 组合日志
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// 开发环境下添加控制台输出
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// 创建特定的logger
export const authLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'auth' },
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/auth.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

export const ocrLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'ocr' },
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/ocr.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

export const learningLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'learning' },
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/learning.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});