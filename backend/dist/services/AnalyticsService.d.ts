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
    topPages: Array<{
        page: string;
        views: number;
    }>;
    visitsByDay: Array<{
        date: string;
        visits: number;
    }>;
    visitsByHour: Array<{
        hour: number;
        visits: number;
    }>;
    topReferrers: Array<{
        referrer: string;
        visits: number;
    }>;
    deviceTypes: Array<{
        type: string;
        count: number;
    }>;
}
declare class AnalyticsService {
    recordVisit(data: VisitData): Promise<any>;
    getAnalytics(startDate: Date, endDate: Date): Promise<AnalyticsStats>;
    private getVisitsByHour;
    private getDeviceTypes;
    getRealTimeStats(): Promise<{
        visitsLastHour: any;
        visitsToday: any;
        activePages: any;
    }>;
    cleanOldVisits(): Promise<any>;
}
export declare const analyticsService: AnalyticsService;
export default AnalyticsService;
//# sourceMappingURL=AnalyticsService.d.ts.map