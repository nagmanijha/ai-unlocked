"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.telemetryService = void 0;
const logger_1 = require("../config/logger");
const cosmosClient_1 = require("./cosmosClient");
class TelemetryService {
    constructor() {
        /** Pending write queue — used for batching if needed */
        this.pendingWrites = 0;
        this.maxPendingWrites = 50;
    }
    /**
     * Log a call start event.
     * Fire-and-forget — does NOT block the audio thread.
     */
    logCallStart(session) {
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
    logTurnComplete(session, metrics) {
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
    logCallEnd(session) {
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
    logError(session, error, context) {
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
    writeAsync(event) {
        // Guard against runaway writes
        if (this.pendingWrites >= this.maxPendingWrites) {
            logger_1.logger.warn(`[Telemetry] Dropping event — ${this.pendingWrites} writes pending`);
            return;
        }
        this.pendingWrites++;
        // setImmediate pushes this to the NEXT event loop iteration
        setImmediate(() => {
            this.writeToCosmos(event)
                .catch(err => {
                logger_1.logger.error('[Telemetry] Cosmos DB write failed (non-blocking)', {
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
    async writeToCosmos(event) {
        const container = cosmosClient_1.cosmosService.getContainer();
        if (container) {
            try {
                await container.items.create({
                    id: `${event.sessionId}-${event.type}-${Date.now()}`,
                    partitionKey: event.callId,
                    ...event,
                });
                return;
            }
            catch (err) {
                logger_1.logger.error('[Telemetry] Cosmos write failed, logging to console', err);
            }
        }
        // Fallback: structured console log so metrics are still captured
        logger_1.logger.info(`[Telemetry:${event.type}]`, {
            sessionId: event.sessionId,
            callId: event.callId,
            ...event.data,
        });
    }
    /**
     * Get count of pending writes (used for health checks).
     */
    getPendingWriteCount() {
        return this.pendingWrites;
    }
}
exports.telemetryService = new TelemetryService();
//# sourceMappingURL=telemetryService.js.map