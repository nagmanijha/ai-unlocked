/** API response types matching backend */

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface User {
    id: string;
    email: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

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

export interface TranscriptEntry {
    speaker: 'caller' | 'assistant';
    text: string;
    timestamp: string;
}

export interface AiResponse {
    query: string;
    response: string;
    confidence: number;
    timestamp: string;
}

export interface KnowledgeDocument {
    id: string;
    filename: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    storageUrl?: string;
    indexingStatus: 'pending' | 'indexing' | 'indexed' | 'failed';
    uploadedBy?: string;
    createdAt: string;
    updatedAt: string;
}

export interface SystemConfig {
    id: string;
    key: string;
    value: any;
    description?: string;
    updatedBy?: string;
    updatedAt: string;
}

export interface AnalyticsOverview {
    totalCallsToday: number;
    averageCallDuration: number;
    activeCallsCount: number;
    topLanguages: { language: string; count: number }[];
    topQuestions: { question: string; count: number }[];
}

export interface CallVolumeDataPoint {
    date: string;
    count: number;
}

export interface LanguageDistribution {
    language: string;
    count: number;
    percentage: number;
}

export interface RealtimeMetrics {
    type: string;
    data: {
        activeCallsCount: number;
        callsPerMinute: number;
        avgResponseTime: string;
        timestamp: string;
    };
}

export interface OverviewMetrics extends AnalyticsOverview {
    activeCalls?: number;
}

export interface CallMetrics {
    id: string;
    language: string;
    duration: number;
    timestamp: string;
    transcript?: string;
    aiResponse?: string;
}
