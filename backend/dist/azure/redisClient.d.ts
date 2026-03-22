import type { ConversationTurn } from './callSession';
declare class RedisService {
    private connected;
    private client;
    private memorySessionStore;
    private memoryRAGCache;
    /**
     * Initialize Redis connection. Falls back to in-memory if not configured.
     */
    initialize(): Promise<void>;
    /**
     * Save conversation history for a call session.
     * TTL = 1 hour (calls rarely exceed this).
     */
    saveSessionState(callId: string, history: ConversationTurn[]): Promise<void>;
    /**
     * Retrieve conversation history for a call session.
     */
    getSessionState(callId: string): Promise<ConversationTurn[]>;
    /**
     * Delete session state when the call ends.
     */
    deleteSessionState(callId: string): Promise<void>;
    /**
     * Cache a RAG retrieval result for a normalized query.
     * TTL = 15 minutes for curriculum content.
     */
    cacheRAGResult(query: string, context: string, ttlSeconds?: number): Promise<void>;
    /**
     * Check cache for a RAG result before hitting Azure AI Search.
     * Returns null on cache miss.
     */
    getCachedRAG(query: string): Promise<string | null>;
    /**
     * Normalize a query string for cache key consistency.
     */
    private normalizeQuery;
    isConnected(): boolean;
}
export declare const redisService: RedisService;
export {};
//# sourceMappingURL=redisClient.d.ts.map