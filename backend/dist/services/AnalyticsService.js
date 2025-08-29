"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class AnalyticsService {
    async recordVisit(data) {
        try {
            const visit = await prisma.visit.create({
                data: {
                    ip: data.ip,
                    userAgent: data.userAgent,
                    page: data.page,
                    referrer: data.referrer,
                    timestamp: data.timestamp
                }
            });
            if (data.page.startsWith('/news/')) {
                const newsId = data.page.split('/news/')[1];
                if (newsId) {
                    await prisma.news.update({
                        where: { id: newsId },
                        data: {
                            views: {
                                increment: 1
                            }
                        }
                    }).catch(() => {
                    });
                }
            }
            return visit;
        }
        catch (error) {
            console.error('Error recording visit:', error);
        }
    }
    async getAnalytics(startDate, endDate) {
        try {
            const [totalVisits, uniqueVisitors, pageViews, topPages, visitsByDay, topReferrers] = await Promise.all([
                prisma.visit.count({
                    where: {
                        timestamp: {
                            gte: startDate,
                            lte: endDate
                        }
                    }
                }),
                prisma.visit.groupBy({
                    by: ['ip'],
                    where: {
                        timestamp: {
                            gte: startDate,
                            lte: endDate
                        }
                    }
                }).then(result => result.length),
                prisma.visit.count({
                    where: {
                        timestamp: {
                            gte: startDate,
                            lte: endDate
                        }
                    }
                }),
                prisma.visit.groupBy({
                    by: ['page'],
                    where: {
                        timestamp: {
                            gte: startDate,
                            lte: endDate
                        }
                    },
                    _count: {
                        id: true
                    },
                    orderBy: {
                        _count: {
                            id: 'desc'
                        }
                    },
                    take: 10
                }).then(result => result.map(item => ({
                    page: item.page,
                    views: item._count.id
                }))),
                prisma.$queryRaw `
          SELECT 
            DATE(timestamp) as date,
            COUNT(*) as visits
          FROM visits 
          WHERE timestamp >= ${startDate} AND timestamp <= ${endDate}
          GROUP BY DATE(timestamp)
          ORDER BY date
        `,
                prisma.visit.groupBy({
                    by: ['referrer'],
                    where: {
                        timestamp: {
                            gte: startDate,
                            lte: endDate
                        },
                        referrer: {
                            not: null
                        }
                    },
                    _count: {
                        id: true
                    },
                    orderBy: {
                        _count: {
                            id: 'desc'
                        }
                    },
                    take: 10
                }).then(result => result.map(item => ({
                    referrer: item.referrer || 'Direct',
                    visits: item._count.id
                })))
            ]);
            const visitsByHour = await this.getVisitsByHour(startDate, endDate);
            const deviceTypes = await this.getDeviceTypes(startDate, endDate);
            return {
                totalVisits,
                uniqueVisitors,
                pageViews,
                topPages,
                visitsByDay: visitsByDay.map(item => ({
                    date: item.date.toISOString().split('T')[0],
                    visits: Number(item.visits)
                })),
                visitsByHour,
                topReferrers,
                deviceTypes
            };
        }
        catch (error) {
            console.error('Error getting analytics:', error);
            throw error;
        }
    }
    async getVisitsByHour(startDate, endDate) {
        try {
            const result = await prisma.$queryRaw `
        SELECT 
          EXTRACT(HOUR FROM timestamp) as hour,
          COUNT(*) as visits
        FROM visits 
        WHERE timestamp >= ${startDate} AND timestamp <= ${endDate}
        GROUP BY EXTRACT(HOUR FROM timestamp)
        ORDER BY hour
      `;
            const visitsByHour = Array.from({ length: 24 }, (_, i) => ({
                hour: i,
                visits: 0
            }));
            result.forEach(item => {
                visitsByHour[Number(item.hour)] = {
                    hour: Number(item.hour),
                    visits: Number(item.visits)
                };
            });
            return visitsByHour;
        }
        catch (error) {
            console.error('Error getting visits by hour:', error);
            return Array.from({ length: 24 }, (_, i) => ({ hour: i, visits: 0 }));
        }
    }
    async getDeviceTypes(startDate, endDate) {
        try {
            const visits = await prisma.visit.findMany({
                where: {
                    timestamp: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                select: {
                    userAgent: true
                }
            });
            const deviceCounts = {
                mobile: 0,
                tablet: 0,
                desktop: 0,
                bot: 0
            };
            visits.forEach(visit => {
                const ua = visit.userAgent.toLowerCase();
                if (ua.includes('bot') || ua.includes('crawler') || ua.includes('spider')) {
                    deviceCounts.bot++;
                }
                else if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
                    deviceCounts.mobile++;
                }
                else if (ua.includes('tablet') || ua.includes('ipad')) {
                    deviceCounts.tablet++;
                }
                else {
                    deviceCounts.desktop++;
                }
            });
            return Object.entries(deviceCounts).map(([type, count]) => ({
                type,
                count
            }));
        }
        catch (error) {
            console.error('Error getting device types:', error);
            return [
                { type: 'desktop', count: 0 },
                { type: 'mobile', count: 0 },
                { type: 'tablet', count: 0 },
                { type: 'bot', count: 0 }
            ];
        }
    }
    async getRealTimeStats() {
        try {
            const now = new Date();
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const [visitsLastHour, visitsToday, activePages] = await Promise.all([
                prisma.visit.count({
                    where: {
                        timestamp: {
                            gte: oneHourAgo
                        }
                    }
                }),
                prisma.visit.count({
                    where: {
                        timestamp: {
                            gte: oneDayAgo
                        }
                    }
                }),
                prisma.visit.groupBy({
                    by: ['page'],
                    where: {
                        timestamp: {
                            gte: oneHourAgo
                        }
                    },
                    _count: {
                        id: true
                    },
                    orderBy: {
                        _count: {
                            id: 'desc'
                        }
                    },
                    take: 5
                }).then(result => result.map(item => ({
                    page: item.page,
                    visits: item._count.id
                })))
            ]);
            return {
                visitsLastHour,
                visitsToday,
                activePages
            };
        }
        catch (error) {
            console.error('Error getting real-time stats:', error);
            throw error;
        }
    }
    async cleanOldVisits() {
        try {
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
            const result = await prisma.visit.deleteMany({
                where: {
                    timestamp: {
                        lt: ninetyDaysAgo
                    }
                }
            });
            console.log(`Cleaned ${result.count} old visit records`);
            return result.count;
        }
        catch (error) {
            console.error('Error cleaning old visits:', error);
            throw error;
        }
    }
}
exports.analyticsService = new AnalyticsService();
exports.default = AnalyticsService;
//# sourceMappingURL=AnalyticsService.js.map