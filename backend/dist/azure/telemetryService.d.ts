import type { CallSession } from './callSession';
/**
 * Phase 4 — Checkpoint 10: Non-Blocking Telemetry (Cosmos DB)
 *
 * Asynchronous Cosmos DB logger for impact metrics.
 *
 * KEY DESIGN: Uses setImmediate() + fire-and-forget promises so that
 * telemetry logging NEVER blocks the main audio event loop. The caller
 * doesn't wait for the Cosmos DB write to complete.
 *
 * Metrics logged:
 * - Call duration and turn count
 * - User intents (transcribed questions)
 * - Languages detected
 * - Schemes accessed (from RAG context)
 * - Per-turn latency (TTFB measurements)
 * - RAG retrieval source (cache vs search vs fallback)
 */
export interface TelemetryEvent {
    type: 'call_start' | 'call_end' | 'turn_complete' | 'error';
    sessionId: string;
    callId: string;
    timestamp: string;
    data: Record<string, any>;
}
interface TurnMetrics {
    turnNumber: number;
    userQuery: string;
    language: string;
    sttLatencyMs: number;
    ragLatencyMs: number;
    ragSource: string;
    llmFirstTokenMs: number;
    ttfbMs: number;
    totalTurnLatencyMs: number;
    assistantResponse: string;
}
declare class TelemetryService {
    /** Pending write queue — used for batching if needed */
    private pendingWrites;
    private maxPendingWrites;
    /**
     * Log a call start event.
     * Fire-and-forget — does NOT block the audio thread.
     */
    logCallStart(session: CallSession): void;
    /**
     * Log a completed turn (one user question → one AI response).
     * Fire-and-forget — does NOT block the audio thread.
     */
    logTurnComplete(session: CallSession, metrics: TurnMetrics): void;
    /**
     * Log a call end event with cumulative session metrics.
     * Fire-and-forget — does NOT block the audio thread.
     */
    logCallEnd(session: CallSession): void;
    /**
     * Log an error event.
     * Fire-and-forget — does NOT block the audio thread.
     */
    logError(session: CallSession, error: any, context: string): void;
    /**
     * CORE: Non-blocking async write to Cosmos DB.
     *
     * Uses setImmediate() to defer the Cosmos write to the next iteration
     * of the Node.js event loop, ensuring the audio processing thread
     * (AMD CPU-bound work) is freed immediately.
     *
     * Errors are caught and logged — they never bubble up or crash the pipeline.
     */
    private writeAsync;
    /**
     * Actual Cosmos DB write operation.
     * Falls back to structured logging if Cosmos is not available.
     */
    private writeToCosmos;
    /**
     * Get count of pending writes (used for health checks).
     */
    getPendingWriteCount(): number;
}
export declare const telemetryService: TelemetryService;
export {};
//# sourceMappingURL=telemetryService.d.ts.map