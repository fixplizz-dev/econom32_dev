import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface VisitData {
  ip: string;
  userAgent: string;
  page: string;
  referrer?: string;
  timestamp: Date;
}

export interface AnalyticsStats {
  totalVisits: number;
  uniqueVisitors: number;
  pageViews: number;
  topPages: Array<{ page: string; views: number }>;
  visitsByDay: Array<{ date: string; visits: number }>;
  visitsByHour: Array<{ hour: number; visits: number }>;
  topReferrers: Array<{ referrer: string; visits: number }>;
  deviceTypes: Array<{ type: string; count: number }>;
}

class AnalyticsService {
  /**
   * Record a page visit
   */
  async recordVisit(data: VisitData) {
    try {
      // Create visit record
      const visit = await prisma.visit.create({
        data: {
          ip: data.ip,
          userAgent: data.userAgent,
          page: data.page,
          referrer: data.referrer,
          timestamp: data.timestamp
        }
      });

      // Update page view count if it's a news article
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
            // Ignore errors if news doesn't exist
          });
        }
      }

      return visit;
    } catch (error) {
      console.error('Error recording visit:', error);
      // Don't throw error to avoid breaking the main request
    }
  }

  /**
   * Get analytics statistics for a date range
   */
  async getAnalytics(startDate: Date, endDate: Date): Promise<AnalyticsStats> {
    try {
      const [
        totalVisits,
        uniqueVisitors,
        pageViews,
        topPages,
        visitsByDay,
        topReferrers
      ] = await Promise.all([
        // Total visits
        prisma.visit.count({
          where: {
            timestamp: {
              gte: startDate,
              lte: endDate
            }
          }
        }),

        // Unique visitors (by IP)
        prisma.visit.groupBy({
          by: ['ip'],
          where: {
            timestamp: {
              gte: startDate,
              lte: endDate
            }
          }
        }).then(result => result.length),

        // Page views (same as total visits for now)
        prisma.visit.count({
          where: {
            timestamp: {
              gte: startDate,
              lte: endDate
            }
          }
        }),

        // Top pages
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
        }).then(result => 
          result.map(item => ({
            page: item.page,
            views: item._count.id
          }))
        ),

        // Visits by day
        prisma.$queryRaw`
          SELECT 
            DATE(timestamp) as date,
            COUNT(*) as visits
          FROM visits 
          WHERE timestamp >= ${startDate} AND timestamp <= ${endDate}
          GROUP BY DATE(timestamp)
          ORDER BY date
        ` as Array<{ date: Date; visits: bigint }>,

        // Top referrers
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
        }).then(result => 
          result.map(item => ({
            referrer: item.referrer || 'Direct',
            visits: item._count.id
          }))
        )
      ]);

      // Process visits by hour
      const visitsByHour = await this.getVisitsByHour(startDate, endDate);

      // Process device types
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
    } catch (error) {
      console.error('Error getting analytics:', error);
      throw error;
    }
  }

  /**
   * Get visits by hour of day
   */
  private async getVisitsByHour(startDate: Date, endDate: Date) {
    try {
      const result = await prisma.$queryRaw`
        SELECT 
          EXTRACT(HOUR FROM timestamp) as hour,
          COUNT(*) as visits
        FROM visits 
        WHERE timestamp >= ${startDate} AND timestamp <= ${endDate}
        GROUP BY EXTRACT(HOUR FROM timestamp)
        ORDER BY hour
      ` as Array<{ hour: number; visits: bigint }>;

      // Fill in missing hours with 0 visits
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
    } catch (error) {
      console.error('Error getting visits by hour:', error);
      return Array.from({ length: 24 }, (_, i) => ({ hour: i, visits: 0 }));
    }
  }

  /**
   * Get device types from user agents
   */
  private async getDeviceTypes(startDate: Date, endDate: Date) {
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
        } else if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
          deviceCounts.mobile++;
        } else if (ua.includes('tablet') || ua.includes('ipad')) {
          deviceCounts.tablet++;
        } else {
          deviceCounts.desktop++;
        }
      });

      return Object.entries(deviceCounts).map(([type, count]) => ({
        type,
        count
      }));
    } catch (error) {
      console.error('Error getting device types:', error);
      return [
        { type: 'desktop', count: 0 },
        { type: 'mobile', count: 0 },
        { type: 'tablet', count: 0 },
        { type: 'bot', count: 0 }
      ];
    }
  }

  /**
   * Get real-time statistics
   */
  async getRealTimeStats() {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const [
        visitsLastHour,
        visitsToday,
        activePages
      ] = await Promise.all([
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
        }).then(result => 
          result.map(item => ({
            page: item.page,
            visits: item._count.id
          }))
        )
      ]);

      return {
        visitsLastHour,
        visitsToday,
        activePages
      };
    } catch (error) {
      console.error('Error getting real-time stats:', error);
      throw error;
    }
  }

  /**
   * Clean old visit data (older than 90 days)
   */
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
    } catch (error) {
      console.error('Error cleaning old visits:', error);
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();
export default AnalyticsService;