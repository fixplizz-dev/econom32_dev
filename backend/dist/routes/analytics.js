"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const AnalyticsService_1 = require("../services/AnalyticsService");
const router = express_1.default.Router();
router.post('/track', async (req, res) => {
    try {
        const { page, referrer } = req.body;
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        const userAgent = req.get('User-Agent') || 'unknown';
        await AnalyticsService_1.analyticsService.recordVisit({
            ip,
            userAgent,
            page,
            referrer,
            timestamp: new Date()
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error tracking visit:', error);
        res.status(500).json({ error: 'Ошибка при записи посещения' });
    }
});
router.get('/stats', auth_1.authMiddleware, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        const stats = await AnalyticsService_1.analyticsService.getAnalytics(start, end);
        res.json({ stats });
    }
    catch (error) {
        console.error('Error getting analytics:', error);
        res.status(500).json({ error: 'Ошибка при получении аналитики' });
    }
});
router.get('/realtime', auth_1.authMiddleware, async (req, res) => {
    try {
        const stats = await AnalyticsService_1.analyticsService.getRealTimeStats();
        res.json({ stats });
    }
    catch (error) {
        console.error('Error getting real-time stats:', error);
        res.status(500).json({ error: 'Ошибка при получении статистики в реальном времени' });
    }
});
router.get('/dashboard', auth_1.authMiddleware, async (req, res) => {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        const [todayStats, weekStats, monthStats, realTimeStats] = await Promise.all([
            AnalyticsService_1.analyticsService.getAnalytics(today, now),
            AnalyticsService_1.analyticsService.getAnalytics(weekAgo, now),
            AnalyticsService_1.analyticsService.getAnalytics(monthAgo, now),
            AnalyticsService_1.analyticsService.getRealTimeStats()
        ]);
        const yesterdayStats = await AnalyticsService_1.analyticsService.getAnalytics(yesterday, today);
        const dailyGrowth = yesterdayStats.totalVisits > 0
            ? ((todayStats.totalVisits - yesterdayStats.totalVisits) / yesterdayStats.totalVisits * 100)
            : 0;
        res.json({
            today: todayStats,
            week: weekStats,
            month: monthStats,
            realTime: realTimeStats,
            growth: {
                daily: Math.round(dailyGrowth * 100) / 100
            }
        });
    }
    catch (error) {
        console.error('Error getting dashboard stats:', error);
        res.status(500).json({ error: 'Ошибка при получении статистики дашборда' });
    }
});
exports.default = router;
//# sourceMappingURL=analytics.js.map