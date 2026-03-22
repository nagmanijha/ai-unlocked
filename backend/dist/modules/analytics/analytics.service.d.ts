import { AnalyticsOverview, CallVolumeDataPoint } from '../../shared/types';
/**
 * Analytics service — aggregates call data from Cosmos DB
 * and caches computed metrics in PostgreSQL for performance.
 * Tracks impact metrics: calls served, learning minutes, languages, schemes accessed.
 */
export declare class AnalyticsService {
    /** Get dashboard overview metrics */
    getOverview(): Promise<AnalyticsOverview>;
    /** Get call volume over time (daily for last 30 days) */
    getCallVolume(days?: number): Promise<CallVolumeDataPoint[]>;
    /** Get language distribution across all calls */
    getLanguageDistribution(): Promise<{
        language: string;
        count: number;
        percentage: number;
    }[]>;
    /** Get top 10 most-asked questions */
    getTopQuestions(): Promise<{
        question: string;
        count: number;
    }[]>;
    /** Export analytics data as CSV string */
    exportCSV(type: string): Promise<string>;
    private getMockOverview;
    private getMockCallVolume;
    private getMockLanguageDistribution;
    private getMockTopQuestions;
    private extractTopQuestions;
}
export declare const analyticsService: AnalyticsService;
//# sourceMappingURL=analytics.service.d.ts.map