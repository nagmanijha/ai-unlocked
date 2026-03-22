import { logger } from '../config/logger';
import { cosmosService } from './cosmosClient';
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

class TelemetryService {
    /** Pending write queue — used for batching if needed */
    private pendingWrites: number = 0;
    private maxPendingWrites: number = 50;

    /**
     * Log a call start event.
     * Fire-and-forget — does NOT block the audio thread.
     */
    logCallStart(session: CallSession): void {
        this.writeAsync({
            type: 'call_start',
            sessionId: session.sessionId,
            callId: session.callId,
            timestamp: new Date().toISOString(),
            data: {
                callerPhoneNumber: session.callerPhoneNumber,
                initialLanguage: session.language,
            },
        });
    }

    /**
     * Log a completed turn (one user question → one AI response).
     * Fire-and-forget — does NOT block the audio thread.
     */
    logTurnComplete(session: CallSession, metrics: TurnMetrics): void {
        this.writeAsync({
            type: 'turn_complete',
            sessionId: session.sessionId,
            callId: session.callId,
            timestamp: new Date().toISOString(),
            data: {
                ...metrics,
                sessionDurationSoFar: session.getDurationSeconds(),
            },
        });
    }

    /**
     * Log a call end event with cumulative session metrics.
     * Fire-and-forget — does NOT block the audio thread.
     */
    logCallEnd(session: CallSession): void {
        this.writeAsync({
            type: 'call_end',
            sessionId: session.sessionId,
            callId: session.callId,
            timestamp: new Date().toISOString(),
            data: {
                durationSeconds: session.getDurationSeconds(),
                totalTurns: session.metrics.totalTurns,
                languagesDetected: Array.from(session.metrics.languagesDetected),
                schemesAccessed: session.metrics.schemesAccessed,
                averageLatencyMs: session.metrics.totalTurns > 0
                    ? Math.round(session.metrics.totalLatencyMs / session.metrics.totalTurns)
                    : 0,
            },
        });
    }

    /**
     * Log an error event.
     * Fire-and-forget — does NOT block the audio thread.
     */
    logError(session: CallSession, error: any, context: string): void {
        this.writeAsync({
            type: 'error',
            sessionId: session.sessionId,
            callId: session.callId,
            timestamp: new Date().toISOString(),
            data: {
                context,
                errorMessage: error?.message || String(error),
                errorStack: error?.stack,
            },
        });
    }

    /**
     * CORE: Non-blocking async write to Cosmos DB.
     *
     * Uses setImmediate() to defer the Cosmos write to the next iteration
     * of the Node.js event loop, ensuring the audio processing thread
     * (AMD CPU-bound work) is freed immediately.
     *
     * Errors are caught and logged — they never bubble up or crash the pipeline.
     */
    private writeAsync(event: TelemetryEvent): void {
        // Guard against runaway writes
        if (this.pendingWrites >= this.maxPendingWrites) {
            logger.warn(`[Telemetry] Dropping event — ${this.pendingWrites} writes pending`);
            return;
        }

        this.pendingWrites++;

        // setImmediate pushes this to the NEXT event loop iteration
        setImmediate(() => {
            this.writeToCosmos(event)
                .catch(err => {
                    logger.error('[Telemetry] Cosmos DB write failed (non-blocking)', {
                        eventType: event.type,
                        sessionId: event.sessionId,
                        error: err?.message || String(err),
                    });
                })
                .finally(() => {
                    this.pendingWrites--;
                });
        });
    }

    /**
     * Actual Cosmos DB write operation.
     * Falls back to structured logging if Cosmos is not available.
     */
    private async writeToCosmos(event: TelemetryEvent): Promise<void> {
        const container = cosmosService.getContainer();

        if (container) {
            try {
                await container.items.create({
                    id: `${event.sessionId}-${event.type}-${Date.now()}`,
                    partitionKey: event.callId,
                    ...event,
                });
                return;
            } catch (err) {
                logger.error('[Telemetry] Cosmos write failed, logging to console', err);
            }
        }

        // Fallback: structured console log so metrics are still captured
        logger.info(`[Telemetry:${event.type}]`, {
            sessionId: event.sessionId,
            callId: event.callId,
            ...event.data,
        });
    }

    /**
     * Get count of pending writes (used for health checks).
     */
    getPendingWriteCount(): number {
        return this.pendingWrites;
    }
}

export const telemetryService = new TelemetryService();
