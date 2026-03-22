/** Standard API response envelope */
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
/** Paginated response */
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
/** Admin user */
export interface AdminUser {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'viewer';
    createdAt: Date;
    updatedAt: Date;
}
/** JWT payload */
export interface JwtPayload {
    userId: string;
    email: string;
    role: string;
}
/** Call log from Cosmos DB */
export interface CallLog {
    id: string;
    phoneNumber: string;
    language: string;
    duration: number;
    status: 'completed' | 'in-progress' | 'failed' | 'missed';
    transcriptSummary?: string;
    transcript?: TranscriptEntry[];
    aiResponses?: AiResponse[];
    startedAt: string;
    endedAt?: string;
}
/** Single transcript entry */
export interface TranscriptEntry {
    speaker: 'caller' | 'assistant';
    text: string;
    timestamp: string;
}
/** AI response entry */
export interface AiResponse {
    query: string;
    response: string;
    confidence: number;
    timestamp: string;
}
/** Knowledge base document */
export interface KnowledgeDocument {
    id: string;
    filename: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    storageUrl?: string;
    indexingStatus: 'pending' | 'indexing' | 'indexed' | 'failed';
    uploadedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}
/** System configuration */
export interface SystemConfig {
    id: string;
    key: string;
    value: unknown;
    description?: string;
    updatedBy?: string;
    updatedAt: Date;
}
/** Analytics overview */
export interface AnalyticsOverview {
    totalCallsToday: number;
    averageCallDuration: number;
    activeCallsCount: number;
    topLanguages: {
        language: string;
        count: number;
    }[];
    topQuestions: {
        question: string;
        count: number;
    }[];
}
/** Call volume data point */
export interface CallVolumeDataPoint {
    date: string;
    count: number;
}
/** Language distribution for analytics */
export interface LanguageDistribution {
    language: string;
    count: number;
    percentage: number;
}
/** Voice pipeline — session state stored in Redis */
export interface CallSessionState {
    sessionId: string;
    callId: string;
    language: string;
    conversationHistory: ConversationTurn[];
    startTime: number;
}
/** Voice pipeline — single conversation turn */
export interface ConversationTurn {
    role: 'user' | 'assistant';
    content: string;
    language: string;
    timestamp: number;
}
/** Voice pipeline — telemetry event written to Cosmos DB */
export interface TelemetryEvent {
    type: 'call_start' | 'call_end' | 'turn_complete' | 'error';
    sessionId: string;
    callId: string;
    timestamp: string;
    data: Record<string, any>;
}
/** Extend Express Request to include authenticated user */
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}
//# sourceMappingURL=types.d.ts.map