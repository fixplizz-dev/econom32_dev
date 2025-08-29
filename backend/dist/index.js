"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const ScheduledBackupService_1 = require("./services/ScheduledBackupService");
dotenv_1.default.config({ path: '../.env' });
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const PORT = process.env.API_PORT || 3002;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://econom32.ru', 'https://www.econom32.ru']
        : ['http://localhost:3001', 'http://localhost:3000'],
    credentials: true
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Слишком много запросов с этого IP, попробуйте позже.'
});
app.use('/api/', limiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'econom32-backend'
    });
});
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
app.use((err, req, res, next) => {
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
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Эндпоинт не найден' });
});
process.on('SIGINT', async () => {
    console.log('Получен сигнал SIGINT, завершаем работу...');
    ScheduledBackupService_1.scheduledBackupService.stop();
    await prisma.$disconnect();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('Получен сигнал SIGTERM, завершаем работу...');
    ScheduledBackupService_1.scheduledBackupService.stop();
    await prisma.$disconnect();
    process.exit(0);
});
app.listen(PORT, () => {
    console.log(`🚀 Backend сервер запущен на порту ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    if (process.env.NODE_ENV === 'production') {
        ScheduledBackupService_1.scheduledBackupService.start(24);
        console.log('📦 Scheduled backup service started (daily backups)');
    }
    else {
        console.log('📦 Scheduled backup service disabled in development mode');
    }
});
exports.default = app;
//# sourceMappingURL=index.js.map