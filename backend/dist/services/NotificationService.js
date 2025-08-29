"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationType = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
var NotificationType;
(function (NotificationType) {
    NotificationType["NEW_APPEAL"] = "NEW_APPEAL";
    NotificationType["APPEAL_UPDATED"] = "APPEAL_UPDATED";
    NotificationType["NEW_COMMENT"] = "NEW_COMMENT";
    NotificationType["SYSTEM_ALERT"] = "SYSTEM_ALERT";
    NotificationType["BACKUP_SUCCESS"] = "BACKUP_SUCCESS";
    NotificationType["BACKUP_FAILED"] = "BACKUP_FAILED";
    NotificationType["SECURITY_ALERT"] = "SECURITY_ALERT";
    NotificationType["NEWS_PUBLISHED"] = "NEWS_PUBLISHED";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
class NotificationService {
    async createNotification(data) {
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
        }
        catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }
    async createNotificationForAllAdmins(data) {
        try {
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
            const notifications = await Promise.all(adminUsers.map(user => this.createNotification({
                ...data,
                userId: user.id
            })));
            return notifications;
        }
        catch (error) {
            console.error('Error creating notifications for admins:', error);
            throw error;
        }
    }
    async notifyNewAppeal(appealId, appealSubject) {
        return this.createNotificationForAllAdmins({
            type: NotificationType.NEW_APPEAL,
            title: 'Новое обращение',
            message: `Получено новое обращение: "${appealSubject}"`,
            data: { appealId },
            priority: 'HIGH'
        });
    }
    async notifyAppealUpdated(userId, appealId, appealSubject) {
        return this.createNotification({
            userId,
            type: NotificationType.APPEAL_UPDATED,
            title: 'Обращение обновлено',
            message: `Обращение "${appealSubject}" было обновлено`,
            data: { appealId },
            priority: 'MEDIUM'
        });
    }
    async createSystemAlert(title, message, priority = 'HIGH') {
        return this.createNotificationForAllAdmins({
            type: NotificationType.SYSTEM_ALERT,
            title,
            message,
            priority
        });
    }
    async notifyBackupStatus(success, message) {
        return this.createNotificationForAllAdmins({
            type: success ? NotificationType.BACKUP_SUCCESS : NotificationType.BACKUP_FAILED,
            title: success ? 'Резервное копирование выполнено' : 'Ошибка резервного копирования',
            message,
            priority: success ? 'LOW' : 'HIGH'
        });
    }
    async createSecurityAlert(title, message, data) {
        return this.createNotificationForAllAdmins({
            type: NotificationType.SECURITY_ALERT,
            title,
            message,
            data,
            priority: 'CRITICAL'
        });
    }
    async getNotificationStats(userId) {
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
                }, {})
            };
        }
        catch (error) {
            console.error('Error getting notification stats:', error);
            throw error;
        }
    }
    async cleanOldNotifications() {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const result = await prisma.notification.deleteMany({
                where: {
                    createdAt: {
                        lt: thirtyDaysAgo
                    },
                    read: true
                }
            });
            console.log(`Cleaned ${result.count} old notifications`);
            return result.count;
        }
        catch (error) {
            console.error('Error cleaning old notifications:', error);
            throw error;
        }
    }
}
exports.notificationService = new NotificationService();
exports.default = NotificationService;
//# sourceMappingURL=NotificationService.js.map