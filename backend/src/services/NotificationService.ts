import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export enum NotificationType {
  NEW_APPEAL = 'NEW_APPEAL',
  APPEAL_UPDATED = 'APPEAL_UPDATED',
  NEW_COMMENT = 'NEW_COMMENT',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  BACKUP_SUCCESS = 'BACKUP_SUCCESS',
  BACKUP_FAILED = 'BACKUP_FAILED',
  SECURITY_ALERT = 'SECURITY_ALERT',
  NEWS_PUBLISHED = 'NEWS_PUBLISHED'
}

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(data: CreateNotificationData) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data ? JSON.stringify(data.data) : null,
          priority: data.priority || 'MEDIUM',
          read: false
        }
      });

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create notification for all admin users
   */
  async createNotificationForAllAdmins(data: Omit<CreateNotificationData, 'userId'>) {
    try {
      // Get all admin users
      const adminUsers = await prisma.user.findMany({
        where: {
          role: {
            in: ['ADMIN', 'EDITOR', 'MODERATOR']
          }
        },
        select: {
          id: true
        }
      });

      // Create notifications for all admins
      const notifications = await Promise.all(
        adminUsers.map(user => 
          this.createNotification({
            ...data,
            userId: user.id
          })
        )
      );

      return notifications;
    } catch (error) {
      console.error('Error creating notifications for admins:', error);
      throw error;
    }
  }

  /**
   * Create notification for new appeal
   */
  async notifyNewAppeal(appealId: string, appealSubject: string) {
    return this.createNotificationForAllAdmins({
      type: NotificationType.NEW_APPEAL,
      title: 'Новое обращение',
      message: `Получено новое обращение: "${appealSubject}"`,
      data: { appealId },
      priority: 'HIGH'
    });
  }

  /**
   * Create notification for appeal update
   */
  async notifyAppealUpdated(userId: string, appealId: string, appealSubject: string) {
    return this.createNotification({
      userId,
      type: NotificationType.APPEAL_UPDATED,
      title: 'Обращение обновлено',
      message: `Обращение "${appealSubject}" было обновлено`,
      data: { appealId },
      priority: 'MEDIUM'
    });
  }

  /**
   * Create system alert notification
   */
  async createSystemAlert(title: string, message: string, priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'HIGH') {
    return this.createNotificationForAllAdmins({
      type: NotificationType.SYSTEM_ALERT,
      title,
      message,
      priority
    });
  }

  /**
   * Create backup status notification
   */
  async notifyBackupStatus(success: boolean, message: string) {
    return this.createNotificationForAllAdmins({
      type: success ? NotificationType.BACKUP_SUCCESS : NotificationType.BACKUP_FAILED,
      title: success ? 'Резервное копирование выполнено' : 'Ошибка резервного копирования',
      message,
      priority: success ? 'LOW' : 'HIGH'
    });
  }

  /**
   * Create security alert notification
   */
  async createSecurityAlert(title: string, message: string, data?: any) {
    return this.createNotificationForAllAdmins({
      type: NotificationType.SECURITY_ALERT,
      title,
      message,
      data,
      priority: 'CRITICAL'
    });
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(userId: string) {
    try {
      const [total, unread, byType] = await Promise.all([
        prisma.notification.count({
          where: { userId }
        }),
        prisma.notification.count({
          where: { userId, read: false }
        }),
        prisma.notification.groupBy({
          by: ['type'],
          where: { userId },
          _count: {
            id: true
          }
        })
      ]);

      return {
        total,
        unread,
        byType: byType.reduce((acc, item) => {
          acc[item.type] = item._count.id;
          return acc;
        }, {} as Record<string, number>)
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw error;
    }
  }

  /**
   * Clean old notifications (older than 30 days)
   */
  async cleanOldNotifications() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo
          },
          read: true // Only delete read notifications
        }
      });

      console.log(`Cleaned ${result.count} old notifications`);
      return result.count;
    } catch (error) {
      console.error('Error cleaning old notifications:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
export default NotificationService;