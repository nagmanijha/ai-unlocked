import { CallLog, PaginatedResponse } from '../../shared/types';
/**
 * Call logs service — reads call data from Azure Cosmos DB.
 * Falls back to mock data when Cosmos DB is not configured.
 */
export declare class CallsService {
    /** Get paginated call logs with filters */
    getCalls(page?: number, pageSize?: number, filters?: {
        startDate?: string;
        endDate?: string;
        language?: string;
        status?: string;
    }): Promise<PaginatedResponse<CallLog>>;
    /** Get a single call by ID */
    getCallById(id: string): Promise<CallLog | null>;
    /** Get active call count (placeholder — uses ACS in production) */
    getActiveCallCount(): Promise<number>;
    /** Generate mock calls for development */
    private generateMockCalls;
    /** Return paginated mock calls */
    private getMockCalls;
}
export declare const callsService: CallsService;
//# sourceMappingURL=calls.service.d.ts.map