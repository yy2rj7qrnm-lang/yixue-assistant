import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

// 导入路由
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import mistakeRoutes from './routes/mistakes';
import knowledgeRoutes from './routes/knowledge';
import reportRoutes from './routes/reports';
import recommendationRoutes from './routes/recommendations';
import questionRoutes from './routes/questions';
import ocrRoutes from './routes/ocr';
import aiRoutes from './routes/ai';

// 导入中间件
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { logger } from './utils/logger';

// 加载环境变量
dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 8000;

// 限流配置
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP限制100个请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试',
    error: 'Too many requests',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 中间件配置
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(limiter);

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API服务器正常运行',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// 路由配置
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/mistakes', authMiddleware, mistakeRoutes);
app.use('/api/knowledge', authMiddleware, knowledgeRoutes);
app.use('/api/reports', authMiddleware, reportRoutes);
app.use('/api/recommendations', authMiddleware, recommendationRoutes);
app.use('/api/questions', authMiddleware, questionRoutes);
app.use('/api/ocr', authMiddleware, ocrRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在',
    error: 'Not Found',
  });
});

// 错误处理中间件
app.use(errorHandler);

// WebSocket连接处理
io.on('connection', (socket) => {
  logger.info(`用户连接: ${socket.id}`);

  // 加入用户房间（用于推送个性化消息）
  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
    logger.info(`用户 ${userId} 加入房间`);
  });

  // 处理错题添加事件
  socket.on('add_mistake', (data) => {
    io.to(`user_${data.userId}`).emit('mistake_added', data);
  });

  // 处理复习提醒
  socket.on('review_reminder', (data) => {
    io.to(`user_${data.userId}`).emit('review_notification', data);
  });

  socket.on('disconnect', () => {
    logger.info(`用户断开连接: ${socket.id}`);
  });
});

// 启动服务器
server.listen(PORT, () => {
  logger.info(`🚀 API服务器启动成功，端口: ${PORT}`);
  logger.info(`📱 客户端地址: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
});

export { app, io };