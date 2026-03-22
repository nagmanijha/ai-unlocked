import axios, { AxiosInstance } from 'axios';
import type {
    ApiResponse,
    AuthResponse,
    PaginatedResponse,
    CallLog,
    KnowledgeDocument,
    SystemConfig,
    AnalyticsOverview,
    CallVolumeDataPoint,
    LanguageDistribution,
} from '../types';

/** Axios-based API client with JWT interceptor */
class ApiService {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: '/api',
            headers: { 'Content-Type': 'application/json' },
        });

        // Add JWT token to every request
        this.client.interceptors.request.use((config) => {
            const token = localStorage.getItem('askbox_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        // Handle 401 responses globally
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                const isLoginRequest = error.config?.url?.includes('/auth/login');
                const isAlreadyOnLogin = window.location.pathname === '/login';

                if (error.response?.status === 401 && !isLoginRequest && !isAlreadyOnLogin) {
                    localStorage.removeItem('askbox_token');
                    localStorage.removeItem('askbox_user');
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );
    }

    // ─── Auth ───────────────────────────────────────────────────
    async login(email: string, password: string): Promise<AuthResponse> {
        const { data } = await this.client.post<ApiResponse<AuthResponse>>('/auth/login', { email, password });
        return data.data!;
    }

    async register(email: string, password: string, name: string): Promise<any> {
        const { data } = await this.client.post<ApiResponse>('/auth/register', { email, password, name });
        return data.data;
    }

    async getProfile(): Promise<any> {
        const { data } = await this.client.get<ApiResponse>('/auth/me');
        return data.data;
    }

    // ─── Calls ──────────────────────────────────────────────────
    async getCalls(params: {
        page?: number;
        pageSize?: number;
        startDate?: string;
        endDate?: string;
        language?: string;
        status?: string;
    }): Promise<PaginatedResponse<CallLog>> {
        const { data } = await this.client.get<ApiResponse<PaginatedResponse<CallLog>>>('/calls', { params });
        return data.data!;
    }

    async getRecentCalls(): Promise<any[]> {
        const data = await this.getCalls({ page: 1, pageSize: 50 });
        return data.items.map(call => ({
            id: call.id,
            language: call.language,
            duration: call.duration,
            timestamp: call.startedAt,
            transcript: call.transcriptSummary || call.transcript?.[0]?.text || '',
            aiResponse: call.aiResponses?.[0]?.response || ''
        }));
    }

    async getCallById(id: string): Promise<CallLog> {
        const { data } = await this.client.get<ApiResponse<CallLog>>(`/calls/${id}`);
        return data.data!;
    }

    async getActiveCalls(): Promise<{ activeCount: number }> {
        const { data } = await this.client.get<ApiResponse<{ activeCount: number }>>('/calls/active');
        return data.data!;
    }

    // ─── Knowledge Base ─────────────────────────────────────────
    async getDocuments(params?: { page?: number; pageSize?: number }): Promise<PaginatedResponse<KnowledgeDocument>> {
        const { data } = await this.client.get<ApiResponse<PaginatedResponse<KnowledgeDocument>>>('/knowledge', { params });
        return data.data!;
    }

    async uploadDocument(file: File): Promise<KnowledgeDocument> {
        const formData = new FormData();
        formData.append('document', file);
        const { data } = await this.client.post<ApiResponse<KnowledgeDocument>>('/knowledge/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data.data!;
    }

    async deleteDocument(id: string): Promise<void> {
        await this.client.delete(`/knowledge/${id}`);
    }

    async triggerIndexing(id: string): Promise<KnowledgeDocument> {
        const { data } = await this.client.post<ApiResponse<KnowledgeDocument>>(`/knowledge/${id}/index`);
        return data.data!;
    }

    // ─── Analytics ──────────────────────────────────────────────
    async getAnalyticsOverview(): Promise<AnalyticsOverview> {
        const { data } = await this.client.get<ApiResponse<AnalyticsOverview>>('/analytics/overview');
        return data.data!;
    }

    async getCallVolume(days?: number): Promise<CallVolumeDataPoint[]> {
        const { data } = await this.client.get<ApiResponse<CallVolumeDataPoint[]>>('/analytics/call-volume', { params: { days } });
        return data.data!;
    }

    async getLanguageDistribution(): Promise<LanguageDistribution[]> {
        const { data } = await this.client.get<ApiResponse<LanguageDistribution[]>>('/analytics/languages');
        return data.data!;
    }

    async getTopQuestions(): Promise<{ question: string; count: number }[]> {
        const { data } = await this.client.get<ApiResponse<{ question: string; count: number }[]>>('/analytics/top-questions');
        return data.data!;
    }

    getExportUrl(type: string): string {
        return `/api/analytics/export?type=${type}`;
    }

    // ─── Settings ───────────────────────────────────────────────
    async getSettings(): Promise<SystemConfig[]> {
        const { data } = await this.client.get<ApiResponse<SystemConfig[]>>('/settings');
        return data.data!;
    }

    async updateSetting(key: string, value: any): Promise<SystemConfig> {
        const { data } = await this.client.put<ApiResponse<SystemConfig>>(`/settings/${key}`, { value });
        return data.data!;
    }

    async createSetting(key: string, value: any, description: string): Promise<SystemConfig> {
        const { data } = await this.client.post<ApiResponse<SystemConfig>>('/settings', { key, value, description });
        return data.data!;
    }

    // ─── Health ─────────────────────────────────────────────────
    async healthCheck(): Promise<any> {
        const { data } = await this.client.get('/health');
        return data;
    }
}

export const api = new ApiService();
