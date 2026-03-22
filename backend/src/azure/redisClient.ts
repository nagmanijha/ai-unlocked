import { logger } from '../config/logger';
import { config } from '../config';
import type { ConversationTurn } from './callSession';

/**
 * Phase 1 — Checkpoint 1 (State) + Phase 2 — Checkpoint 4 (RAG Cache)
 *
 * Redis client wrapper for:
 * 1. Conversation state management (session history indexed by Call ID)
 * 2. RAG result caching (frequently asked curriculum/scheme questions)
 *
 * Falls back to in-memory Map when Redis is not configured,
 * so the pipeline works in local development without Redis.
 */

interface CachedRAGResult {
    context: string;
    timestamp: number;
    ttlSeconds: number;
}

class RedisService {
    private connected: boolean = false;
    private client: any = null;

    // In-memory fallback stores
    private memorySessionStore: Map<string, ConversationTurn[]> = new Map();
    private memoryRAGCache: Map<string, CachedRAGResult> = new Map();

    /**
     * Initialize Redis connection. Falls back to in-memory if not configured.
     */
    async initialize(): Promise<void> {
        if (!config.redisUrl) {
            logger.warn('[Redis] No REDIS_URL configured — using in-memory fallback');
            return;
        }

        try {
            // Dynamic import to avoid crashing if ioredis is not installed
            const Redis = (await import('ioredis')).default;
            this.client = new Redis(config.redisUrl, {
                maxRetriesPerRequest: 3,
                retryStrategy: (times: number) => {
                    if (times > 3) return null; // Stop retrying
                    return Math.min(times * 200, 2000);
                },
                lazyConnect: true,
            });

            await this.client.connect();
            this.connected = true;
            logger.info('[Redis] Connected successfully');
        } catch (error) {
            logger.warn('[Redis] Connection failed — falling back to in-memory', { error });
            this.connected = false;
        }
    }

    // ─── Conversation State (Checkpoint 9: Session Memory) ─────────────────

    /**
     * Save conversation history for a call session.
     * TTL = 1 hour (calls rarely exceed this).
     */
    async saveSessionState(callId: string, history: ConversationTurn[]): Promise<void> {
        const key = `askbox:session:${callId}`;
        const value = JSON.stringify(history);

        if (this.connected && this.client) {
            try {
                await this.client.setex(key, 3600, value);
                return;
            } catch (err) {
                logger.error('[Redis] Failed to save session state', err);
            }
        }

        // Fallback
        this.memorySessionStore.set(callId, history);
    }

    /**
     * Retrieve conversation history for a call session.
     */
    async getSessionState(callId: string): Promise<ConversationTurn[]> {
        const key = `askbox:session:${callId}`;

        if (this.connected && this.client) {
            try {
                const raw = await this.client.get(key);
                return raw ? JSON.parse(raw) : [];
            } catch (err) {
                logger.error('[Redis] Failed to get session state', err);
            }
        }

        // Fallback
        return this.memorySessionStore.get(callId) || [];
    }

    /**
     * Delete session state when the call ends.
     */
    async deleteSessionState(callId: string): Promise<void> {
        const key = `askbox:session:${callId}`;

        if (this.connected && this.client) {
            try {
                await this.client.del(key);
                return;
            } catch (err) {
                logger.error('[Redis] Failed to delete session state', err);
            }
        }

        this.memorySessionStore.delete(callId);
    }

    // ─── RAG Cache (Checkpoint 4: Fast-path for frequent questions) ────────

    /**
     * Cache a RAG retrieval result for a normalized query.
     * TTL = 15 minutes for curriculum content.
     */
    async cacheRAGResult(query: string, context: string, ttlSeconds: number = 900): Promise<void> {
        const key = `askbox:rag:${this.normalizeQuery(query)}`;
        const value = JSON.stringify({ context, timestamp: Date.now(), ttlSeconds });

        if (this.connected && this.client) {
            try {
                await this.client.setex(key, ttlSeconds, value);
                return;
            } catch (err) {
                logger.error('[Redis] Failed to cache RAG result', err);
            }
        }

        // Fallback
        this.memoryRAGCache.set(key, { context, timestamp: Date.now(), ttlSeconds });
    }

    /**
     * Check cache for a RAG result before hitting Azure AI Search.
     * Returns null on cache miss.
     */
    async getCachedRAG(query: string): Promise<string | null> {
        const key = `askbox:rag:${this.normalizeQuery(query)}`;

        if (this.connected && this.client) {
            try {
                const raw = await this.client.get(key);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    return parsed.context;
                }
                return null;
            } catch (err) {
                logger.error('[Redis] Failed to get cached RAG', err);
            }
        }

        // Fallback — check expiry manually
        const cached = this.memoryRAGCache.get(key);
        if (cached) {
            const age = (Date.now() - cached.timestamp) / 1000;
            if (age < cached.ttlSeconds) {
                return cached.context;
            }
            this.memoryRAGCache.delete(key);
        }
        return null;
    }

    /**
     * Normalize a query string for cache key consistency.
     */
    private normalizeQuery(query: string): string {
        return query.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_').slice(0, 100);
    }

    isConnected(): boolean {
        return this.connected;
    }
}

export const redisService = new RedisService();
