"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisService = void 0;
const logger_1 = require("../config/logger");
const config_1 = require("../config");
class RedisService {
    constructor() {
        this.connected = false;
        this.client = null;
        // In-memory fallback stores
        this.memorySessionStore = new Map();
        this.memoryRAGCache = new Map();
    }
    /**
     * Initialize Redis connection. Falls back to in-memory if not configured.
     */
    async initialize() {
        if (!config_1.config.redisUrl) {
            logger_1.logger.warn('[Redis] No REDIS_URL configured — using in-memory fallback');
            return;
        }
        try {
            // Dynamic import to avoid crashing if ioredis is not installed
            const Redis = (await Promise.resolve().then(() => __importStar(require('ioredis')))).default;
            this.client = new Redis(config_1.config.redisUrl, {
                maxRetriesPerRequest: 3,
                retryStrategy: (times) => {
                    if (times > 3)
                        return null; // Stop retrying
                    return Math.min(times * 200, 2000);
                },
                lazyConnect: true,
            });
            await this.client.connect();
            this.connected = true;
            logger_1.logger.info('[Redis] Connected successfully');
        }
        catch (error) {
            logger_1.logger.warn('[Redis] Connection failed — falling back to in-memory', { error });
            this.connected = false;
        }
    }
    // ─── Conversation State (Checkpoint 9: Session Memory) ─────────────────
    /**
     * Save conversation history for a call session.
     * TTL = 1 hour (calls rarely exceed this).
     */
    async saveSessionState(callId, history) {
        const key = `askbox:session:${callId}`;
        const value = JSON.stringify(history);
        if (this.connected && this.client) {
            try {
                await this.client.setex(key, 3600, value);
                return;
            }
            catch (err) {
                logger_1.logger.error('[Redis] Failed to save session state', err);
            }
        }
        // Fallback
        this.memorySessionStore.set(callId, history);
    }
    /**
     * Retrieve conversation history for a call session.
     */
    async getSessionState(callId) {
        const key = `askbox:session:${callId}`;
        if (this.connected && this.client) {
            try {
                const raw = await this.client.get(key);
                return raw ? JSON.parse(raw) : [];
            }
            catch (err) {
                logger_1.logger.error('[Redis] Failed to get session state', err);
            }
        }
        // Fallback
        return this.memorySessionStore.get(callId) || [];
    }
    /**
     * Delete session state when the call ends.
     */
    async deleteSessionState(callId) {
        const key = `askbox:session:${callId}`;
        if (this.connected && this.client) {
            try {
                await this.client.del(key);
                return;
            }
            catch (err) {
                logger_1.logger.error('[Redis] Failed to delete session state', err);
            }
        }
        this.memorySessionStore.delete(callId);
    }
    // ─── RAG Cache (Checkpoint 4: Fast-path for frequent questions) ────────
    /**
     * Cache a RAG retrieval result for a normalized query.
     * TTL = 15 minutes for curriculum content.
     */
    async cacheRAGResult(query, context, ttlSeconds = 900) {
        const key = `askbox:rag:${this.normalizeQuery(query)}`;
        const value = JSON.stringify({ context, timestamp: Date.now(), ttlSeconds });
        if (this.connected && this.client) {
            try {
                await this.client.setex(key, ttlSeconds, value);
                return;
            }
            catch (err) {
                logger_1.logger.error('[Redis] Failed to cache RAG result', err);
            }
        }
        // Fallback
        this.memoryRAGCache.set(key, { context, timestamp: Date.now(), ttlSeconds });
    }
    /**
     * Check cache for a RAG result before hitting Azure AI Search.
     * Returns null on cache miss.
     */
    async getCachedRAG(query) {
        const key = `askbox:rag:${this.normalizeQuery(query)}`;
        if (this.connected && this.client) {
            try {
                const raw = await this.client.get(key);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    return parsed.context;
                }
                return null;
            }
            catch (err) {
                logger_1.logger.error('[Redis] Failed to get cached RAG', err);
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
    normalizeQuery(query) {
        return query.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_').slice(0, 100);
    }
    isConnected() {
        return this.connected;
    }
}
exports.redisService = new RedisService();
//# sourceMappingURL=redisClient.js.map