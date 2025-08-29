import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { scheduledBackupService } from './services/ScheduledBackupService';

// Load environment variables
dotenv.config({ path: '../.env' });

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.API_PORT || 3002;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://econom32.ru', 'https://www.econom32.ru']
    : ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Слишком много запросов с этого IP, попробуйте позже.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'econom32-backend'
  });
});

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/news', require('./routes/news'));
app.use('/api/pages', require('./routes/pages'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/appeals', require('./routes/appeals'));
app.use('/api/banners', require('./routes/banners'));
app.use('/api/files', require('./routes/files'));
app.use('/api/notifications', require('./routes/notifications').default);
app.use('/api/analytics', require('./routes/analytics').default);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Неверный формат JSON' });
  }
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Внутренняя ошибка сервера' 
      : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Эндпоинт не найден' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Получен сигнал SIGINT, завершаем работу...');
  scheduledBackupService.stop();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Получен сигнал SIGTERM, завершаем работу...');
  scheduledBackupService.stop();
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Backend сервер запущен на порту ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  
  // Start scheduled backup service (daily backups)
  if (process.env.NODE_ENV === 'production') {
    scheduledBackupService.start(24); // Every 24 hours
    console.log('📦 Scheduled backup service started (daily backups)');
  } else {
    console.log('📦 Scheduled backup service disabled in development mode');
  }
});

export default app;