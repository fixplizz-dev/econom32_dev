export declare enum NotificationType {
    NEW_APPEAL = "NEW_APPEAL",
    APPEAL_UPDATED = "APPEAL_UPDATED",
    NEW_COMMENT = "NEW_COMMENT",
    SYSTEM_ALERT = "SYSTEM_ALERT",
    BACKUP_SUCCESS = "BACKUP_SUCCESS",
    BACKUP_FAILED = "BACKUP_FAILED",
    SECURITY_ALERT = "SECURITY_ALERT",
    NEWS_PUBLISHED = "NEWS_PUBLISHED"
}
export interface CreateNotificationData {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: any;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
declare class NotificationService {
    createNotification(data: CreateNotificationData): Promise<any>;
    createNotificationForAllAdmins(data: Omit<CreateNotificationData, 'userId'>): Promise<any>;
    notifyNewAppeal(appealId: string, appealSubject: string): Promise<any>;
    notifyAppealUpdated(userId: string, appealId: string, appealSubject: string): Promise<any>;
    createSystemAlert(title: string, message: string, priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): Promise<any>;
    notifyBackupStatus(success: boolean, message: string): Promise<any>;
    createSecurityAlert(title: string, message: string, data?: any): Promise<any>;
    getNotificationStats(userId: string): Promise<{
        total: any;
        unread: any;
        byType: any;
    }>;
    cleanOldNotifications(): Promise<any>;
}
export declare const notificationService: NotificationService;
export default NotificationService;
//# sourceMappingURL=NotificationService.d.ts.map