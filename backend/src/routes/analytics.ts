import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { analyticsService } from '../services/AnalyticsService';

const router = express.Router();

// Middleware to track visits (public endpoint)
router.post('/track', async (req, res) => {
  try {
    const { page, referrer } = req.body;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    await analyticsService.recordVisit({
      ip,
      userAgent,
      page,
      referrer,
      timestamp: new Date()
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking visit:', error);
    res.status(500).json({ error: 'Ошибка при записи посещения' });
  }
});

// Get analytics data (admin only)
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = endDate ? new Date(endDate as string) : new Date();

    const stats = await analyticsService.getAnalytics(start, end);
    
    res.json({ stats });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({ error: 'Ошибка при получении аналитики' });
  }
});

// Get real-time statistics (admin only)
router.get('/realtime', authMiddleware, async (req, res) => {
  try {
    const stats = await analyticsService.getRealTimeStats();
    res.json({ stats });
  } catch (error) {
    console.error('Error getting real-time stats:', error);
    res.status(500).json({ error: 'Ошибка при получении статистики в реальном времени' });
  }
});

// Get dashboard statistics (admin only)
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      todayStats,
      weekStats,
      monthStats,
      realTimeStats
    ] = await Promise.all([
      analyticsService.getAnalytics(today, now),
      analyticsService.getAnalytics(weekAgo, now),
      analyticsService.getAnalytics(monthAgo, now),
      analyticsService.getRealTimeStats()
    ]);

    // Calculate growth rates
    const yesterdayStats = await analyticsService.getAnalytics(yesterday, today);
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
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ error: 'Ошибка при получении статистики дашборда' });
  }
});

export default router;