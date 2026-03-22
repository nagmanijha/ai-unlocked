import { cosmosService } from '../../azure/cosmosClient';
import { CallLog, PaginatedResponse, AnalyticsOverview } from '../../shared/types';
import { logger } from '../../config/logger';

/**
 * Call logs service — reads call data from Azure Cosmos DB.
 * Falls back to mock data when Cosmos DB is not configured.
 */
export class CallsService {
    /** Get paginated call logs with filters */
    async getCalls(
        page: number = 1,
        pageSize: number = 20,
        filters: {
            startDate?: string;
            endDate?: string;
            language?: string;
            status?: string;
        } = {}
    ): Promise<PaginatedResponse<CallLog>> {
        const container = cosmosService.getContainer();
        if (!container) return this.getMockCalls(page, pageSize);

        if (!container) {
            // Return mock data for development
            return this.getMockCalls(page, pageSize);
        }

        try {
            let query = 'SELECT * FROM c WHERE 1=1';
            const parameters: any[] = [];

            if (filters.startDate) {
                query += ` AND c.startedAt >= @startDate`;
                parameters.push({ name: '@startDate', value: filters.startDate });
            }
            if (filters.endDate) {
                query += ` AND c.startedAt <= @endDate`;
                parameters.push({ name: '@endDate', value: filters.endDate });
            }
            if (filters.language) {
                query += ` AND c.language = @language`;
                parameters.push({ name: '@language', value: filters.language });
            }
            if (filters.status) {
                query += ` AND c.status = @status`;
                parameters.push({ name: '@status', value: filters.status });
            }

            // Get total count
            const countQuery = query.replace('SELECT *', 'SELECT VALUE COUNT(1)');
            const countResult = await container.items.query({ query: countQuery, parameters }).fetchAll();
            const total = countResult.resources[0] || 0;

            // Get paginated results
            query += ` ORDER BY c.startedAt DESC OFFSET ${(page - 1) * pageSize} LIMIT ${pageSize}`;
            const result = await container.items.query({ query, parameters }).fetchAll();

            return {
                items: result.resources as CallLog[],
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            };
        } catch (error) {
            logger.error('Failed to query Cosmos DB for call logs', { error });
            return this.getMockCalls(page, pageSize);
        }
    }

    /** Get a single call by ID */
    async getCallById(id: string): Promise<CallLog | null> {
        const container = cosmosService.getContainer();

        if (!container) {
            const mockCalls = this.generateMockCalls();
            return mockCalls.find((c) => c.id === id) || mockCalls[0];
        }

        try {
            const { resource } = await container.item(id, id).read();
            return resource as CallLog;
        } catch (error) {
            logger.error('Failed to get call from Cosmos DB', { error, id });
            return null;
        }
    }

    /** Get active call count (placeholder — uses ACS in production) */
    async getActiveCallCount(): Promise<number> {
        // In production, this would query Azure Communication Services
        // for currently active calls. Returning mock value for now.
        return Math.floor(Math.random() * 15) + 1;
    }

    /** Generate mock calls for development */
    private generateMockCalls(): CallLog[] {
        const languages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Marathi', 'Malayalam'];
        const statuses: CallLog['status'][] = ['completed', 'in-progress', 'failed', 'missed'];
        const questions = [
            'What is photosynthesis?',
            'Explain Newton\'s laws of motion',
            'What is the water cycle?',
            'Tell me about the solar system',
            'What are prime numbers?',
            'Explain cell division',
            'What is climate change?',
            'How does electricity work?',
            'What is democracy?',
            'Explain the periodic table',
        ];

        return Array.from({ length: 50 }, (_, i) => {
            const startTime = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
            const duration = Math.floor(Math.random() * 600) + 30;
            const lang = languages[Math.floor(Math.random() * languages.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const question = questions[Math.floor(Math.random() * questions.length)];

            return {
                id: `call-${String(i + 1).padStart(4, '0')}`,
                phoneNumber: `+91${Math.floor(7000000000 + Math.random() * 2999999999)}`,
                language: lang,
                duration,
                status,
                transcriptSummary: `Student asked about: ${question}`,
                transcript: [
                    { speaker: 'assistant' as const, text: ['Hindi', 'Marathi', 'Bengali'].includes(lang) ? 'AskBox mein aapka swagat hai! Main aapki kaise madad kar sakti hoon?' : 'Welcome to AskBox! How can I help you today?', timestamp: startTime.toISOString() },
                    { speaker: 'caller' as const, text: question, timestamp: new Date(startTime.getTime() + 5000).toISOString() },
                    { speaker: 'assistant' as const, text: `Great question! Let me explain ${question.toLowerCase().replace('?', '')}...`, timestamp: new Date(startTime.getTime() + 8000).toISOString() },
                ],
                aiResponses: [
                    { query: question, response: `[AI response to: ${question}]`, confidence: 0.85 + Math.random() * 0.15, timestamp: new Date(startTime.getTime() + 8000).toISOString() },
                ],
                startedAt: startTime.toISOString(),
                endedAt: new Date(startTime.getTime() + duration * 1000).toISOString(),
            };
        });
    }

    /** Return paginated mock calls */
    private getMockCalls(page: number, pageSize: number): PaginatedResponse<CallLog> {
        const allCalls = this.generateMockCalls();
        const start = (page - 1) * pageSize;
        const items = allCalls.slice(start, start + pageSize);

        return {
            items,
            total: allCalls.length,
            page,
            pageSize,
            totalPages: Math.ceil(allCalls.length / pageSize),
        };
    }
}

export const callsService = new CallsService();
