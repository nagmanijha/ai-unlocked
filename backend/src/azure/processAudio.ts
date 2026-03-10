import { WebSocket } from 'ws';
import { logger } from '../config/logger';

// ── Service Imports ──
import { CallSession } from './callSession';
import { redisService } from './redisClient';
import { sttService, STTController, STTResult } from './sttService';
import { ragService } from './ragService';
import { llmService } from './llmService';
import { ttsService } from './ttsService';
import { telemetryService } from './telemetryService';

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║            AskBox — Real-Time Voice Pipeline Orchestrator          ║
 * ║                                                                    ║
 * ║  Phase 1: Ingress   → WebSocket init, audio decode, buffering     ║
 * ║  Phase 2: Intellect → STT + Lang ID, RAG retrieval, LLM stream   ║
 * ║  Phase 3: Output    → Semantic TTS chunking, audio playback       ║
 * ║  Phase 4: Teardown  → Graceful disconnect, async Cosmos logging   ║
 * ║                                                                    ║
 * ║  Team Node — Nagmani Jha — AI for Social Good Hackathon          ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * ARCHITECTURE:
 * - One CallSession per incoming ACS WebSocket connection
 * - Continuous STT recognizer feeds "recognized" events (endpointing)
 * - Each recognized utterance triggers the full AI workflow (RAG → LLM → TTS)
 * - Barge-in: if user speaks while AI is responding, AbortController kills
 *   the current LLM stream + TTS buffer and restarts listening
 * - All telemetry is fire-and-forget via setImmediate (never blocks audio)
 */

export class AudioPipeline {
    private sessions: Map<string, CallSession> = new Map();
    private sttControllers: Map<string, STTController> = new Map();

    constructor() { }

    /**
     * ═══════════════════════════════════════════════════════════════════
     * PHASE 1 — CHECKPOINT 1: Call Routing & WebSocket Initialization
     * ═══════════════════════════════════════════════════════════════════
     *
     * Called when ACS establishes a bidirectional WebSocket for a new call.
     * Creates a unique session, starts continuous STT, and begins listening.
     */
    public handleConnection(ws: WebSocket, req: any) {
        // Extract Call ID from ACS connection URL or query params
        const callId = this.extractCallId(req);

        // ── Create session with unique ID ──
        const session = new CallSession(callId, ws);
        this.sessions.set(callId, session);

        // Extract caller phone number from ACS metadata if available
        const callerPhone = req.headers?.['x-acs-caller'] || 'unknown';
        session.callerPhoneNumber = callerPhone;

        logger.info(`[Pipeline] ══════ New call connected ══════`);
        logger.info(`[Pipeline] Call ID: ${callId}`);
        logger.info(`[Pipeline] Session ID: ${session.sessionId}`);

        // ── Log call start (non-blocking Cosmos write) ──
        telemetryService.logCallStart(session);

        // ── Start continuous STT recognizer ──
        const sttController = sttService.createRecognizer(
            session,
            // onRecognized callback — fired when user finishes speaking
            (result: STTResult) => this.onSpeechRecognized(session, result),
            // onSpeechStart callback — fired when user starts speaking (barge-in)
            () => this.onSpeechStarted(session)
        );
        this.sttControllers.set(callId, sttController);

        // ═══════════════════════════════════════════════════════════════
        // PHASE 1 — CHECKPOINT 2: Audio Packet Decoding & Buffering
        // ═══════════════════════════════════════════════════════════════
        ws.on('message', (data: Buffer | string) => {
            try {
                if (typeof data === 'string') {
                    // ACS sends JSON-wrapped base64 audio packets
                    const payload = JSON.parse(data);
                    if (payload.kind === 'AudioData') {
                        // Decode base64 → raw PCM (16kHz, 16-bit, mono)
                        const pcmBuffer = Buffer.from(payload.audioData.data, 'base64');
                        session.pushAudio(pcmBuffer);
                        sttController.pushAudio(pcmBuffer);
                    }
                } else if (Buffer.isBuffer(data)) {
                    // Direct binary PCM for testing
                    session.pushAudio(data);
                    sttController.pushAudio(data);
                }
            } catch (error) {
                logger.error(`[Pipeline] Error decoding audio packet`, { error, callId });
            }
        });

        // ═══════════════════════════════════════════════════════════════
        // PHASE 4 — CHECKPOINT 10: Graceful Disconnect
        // CHECKLIST ITEM 4: WebSocket "Death" Handling
        // ═══════════════════════════════════════════════════════════════
        ws.on('close', (code: number, reason: Buffer) => {
            logger.info(`[Pipeline] ══════ Call disconnected ══════ Call ID: ${callId}, code: ${code}, reason: ${reason?.toString() || 'none'}`);
            this.teardownSession(callId);
        });

        ws.on('error', (err) => {
            logger.error(`[Pipeline] WebSocket error — Call ID: ${callId}`, err);

            // Notify ACS to hang up the call so we don't leave a zombie
            try {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        kind: 'CallTerminated',
                        callTerminated: {
                            reason: 'BackendError',
                            message: err?.message || 'Internal server error',
                        },
                    }));
                }
            } catch (sendErr) {
                logger.error(`[Pipeline] Failed to notify ACS of termination`, sendErr);
            } finally {
                this.teardownSession(callId);
            }
        });

        // Heartbeat: detect dead connections (no data for 60s)
        let lastActivityTime = Date.now();
        const heartbeatInterval = setInterval(() => {
            const silenceMs = Date.now() - lastActivityTime;
            if (silenceMs > 60_000) {
                logger.warn(`[Pipeline] No activity for 60s — killing session ${callId}`);
                clearInterval(heartbeatInterval);
                this.teardownSession(callId);
                try { ws.close(1000, 'Timeout'); } catch { }
            }
        }, 15_000);

        // Update activity timestamp on every message
        ws.on('message', () => { lastActivityTime = Date.now(); });

        // Clean up heartbeat on close
        ws.on('close', () => { clearInterval(heartbeatInterval); });
    }

    /**
     * ═══════════════════════════════════════════════════════════════════
     * PHASE 3 — CHECKPOINT 9: Interruption & Barge-in Handling
     * ═══════════════════════════════════════════════════════════════════
     *
     * Called when STT detects the user started speaking while the AI
     * is still generating a response. Immediately:
     * 1. Sends "StopAudio" to ACS to halt playback on the caller's phone
     * 2. Aborts the current LLM generation via AbortController
     * 3. Flushes the TTS audio buffer
     */
    private onSpeechStarted(session: CallSession): void {
        if (!session.isProcessing) return; // Not currently responding

        logger.info(`[Pipeline:${session.sessionId}] 🔴 BARGE-IN — User interrupted AI`);

        // Send stop signal to ACS to halt current audio playback
        session.sendStopAudio();

        // Abort the current LLM + TTS workflow
        session.abortCurrentTurn();
        session.endTurn();
    }

    /**
     * ═══════════════════════════════════════════════════════════════════
     * PHASE 2 — CHECKPOINT 3: Real-Time STT & Language ID (Endpointing)
     * ═══════════════════════════════════════════════════════════════════
     *
     * Called when the STT recognizer detects the user has finished speaking
     * (silence after speech = endpointing). Triggers the full AI workflow.
     */
    private async onSpeechRecognized(session: CallSession, result: STTResult): Promise<void> {
        if (!result.text || result.text.trim().length === 0) return;

        logger.info(`[Pipeline:${session.sessionId}] 🎤 STT: "${result.text}" [lang=${result.language}, conf=${result.confidence}]`);

        // Update session language from Language ID
        session.setLanguage(result.language);

        // Add user's utterance to conversation history
        session.addTurn('user', result.text);

        // Save state to Redis
        redisService.saveSessionState(session.callId, session.conversationHistory).catch(() => { });

        // ── Execute the full AI workflow ──
        await this.executeAIWorkflow(session, result.text);
    }

    /**
     * ═══════════════════════════════════════════════════════════════════
     * THE CORE PIPELINE — Phases 2→3 orchestration
     * ═══════════════════════════════════════════════════════════════════
     *
     * Executes: RAG retrieval → Prompt assembly → LLM streaming → TTS chunking
     * All with barge-in support via AbortController.
     */
    private async executeAIWorkflow(session: CallSession, userQuery: string): Promise<void> {
        const turnStartTime = Date.now();
        const turnController = session.startNewTurn();
        const signal = turnController.signal;

        let sttLatencyMs = 0;
        let ragLatencyMs = 0;
        let ragSource = 'fallback';
        let llmFirstTokenMs = 0;
        let ttfbMs = 0;
        let assistantResponse = '';

        try {
            // ── PHASE 2 — CHECKPOINT 4 & 5: RAG Retrieval + Prompt Assembly ──
            const ragStartTime = Date.now();

            const { messages, context, retrievalSource, retrievalLatencyMs } =
                await ragService.retrieveAndAssemble(
                    userQuery,
                    session.language,
                    session.conversationHistory.slice(0, -1) // exclude current turn
                );

            ragLatencyMs = retrievalLatencyMs;
            ragSource = retrievalSource;
            sttLatencyMs = ragStartTime - turnStartTime;

            // Track schemes accessed for telemetry
            if (context.toLowerCase().includes('pradhan mantri') ||
                context.toLowerCase().includes('yojana') ||
                context.toLowerCase().includes('scheme')) {
                session.metrics.schemesAccessed.push(userQuery.slice(0, 50));
            }

            if (signal.aborted) return; // Barge-in check

            // ── PHASE 2 — CHECKPOINT 6: Asynchronous LLM Streaming ──
            logger.info(`[Pipeline:${session.sessionId}] 🤖 Starting LLM stream (${ragSource} context)...`);

            const llmStream = llmService.streamCompletion({
                messages,
                signal,
                temperature: 0.7,
                maxTokens: 800,
            });

            // ── PHASE 3 — CHECKPOINT 7: Semantic TTS Chunking ──
            const chunker = ttsService.createChunker();
            let firstByteSent = false;
            const llmStartTime = Date.now();

            for await (const token of llmStream) {
                if (signal.aborted) {
                    logger.info(`[Pipeline:${session.sessionId}] ⚡ Barge-in — aborting LLM+TTS`);
                    break;
                }

                if (!firstByteSent) {
                    llmFirstTokenMs = Date.now() - llmStartTime;
                }

                assistantResponse += token;

                // Feed token to the semantic chunker
                const chunk = chunker.addToken(token);

                if (chunk) {
                    // ── PHASE 3 — CHECKPOINT 8: Audio Stream Playback to ACS ──
                    const audioBuffer = await ttsService.synthesize(chunk, session.language);

                    if (signal.aborted) break; // Check again after TTS

                    const sent = session.sendAudio(audioBuffer);

                    if (sent && !firstByteSent) {
                        ttfbMs = Date.now() - turnStartTime;
                        firstByteSent = true;
                        logger.info(`[Pipeline:${session.sessionId}] ⚡ TTFB: ${ttfbMs}ms`);
                    }
                }
            }

            // ── Flush remaining text in the chunker ──
            if (!signal.aborted) {
                const remaining = chunker.flush();
                if (remaining) {
                    const audioBuffer = await ttsService.synthesize(remaining, session.language);
                    session.sendAudio(audioBuffer);
                }
            }

            // Add assistant response to conversation history
            if (assistantResponse.trim()) {
                session.addTurn('assistant', assistantResponse.trim());
                // Sync to Redis
                redisService.saveSessionState(session.callId, session.conversationHistory).catch(() => { });
            }

            const totalTurnLatencyMs = Date.now() - turnStartTime;
            session.metrics.totalLatencyMs += totalTurnLatencyMs;

            logger.info(`[Pipeline:${session.sessionId}] ✅ Turn complete — total: ${totalTurnLatencyMs}ms, TTFB: ${ttfbMs}ms, RAG: ${ragLatencyMs}ms (${ragSource})`);

            // ── PHASE 4 — CHECKPOINT 10: Non-blocking telemetry ──
            telemetryService.logTurnComplete(session, {
                turnNumber: session.metrics.totalTurns,
                userQuery,
                language: session.language,
                sttLatencyMs,
                ragLatencyMs,
                ragSource,
                llmFirstTokenMs,
                ttfbMs,
                totalTurnLatencyMs,
                assistantResponse: assistantResponse.slice(0, 200), // Truncate for storage
            });

        } catch (error: any) {
            if (error.name === 'AbortError' || signal.aborted) {
                logger.info(`[Pipeline:${session.sessionId}] Turn aborted (barge-in)`);
            } else {
                logger.error(`[Pipeline:${session.sessionId}] AI workflow error`, error);
                telemetryService.logError(session, error, 'executeAIWorkflow');
            }
        } finally {
            session.endTurn();
        }
    }

    /**
     * ═══════════════════════════════════════════════════════════════════
     * PHASE 4 — CHECKPOINT 10: Graceful Disconnect & Async Logging
     * ═══════════════════════════════════════════════════════════════════
     *
     * Full teardown when a call ends:
     * 1. Stop the STT recognizer and release audio resources
     * 2. Log call end metrics to Cosmos DB (non-blocking)
     * 3. Clean up Redis session state
     * 4. Free all memory (audio buffers, history, session map entry)
     */
    private async teardownSession(callId: string): Promise<void> {
        const session = this.sessions.get(callId);
        if (!session) return;

        logger.info(`[Pipeline] Tearing down session for Call ID: ${callId}`);

        // Stop STT recognizer
        const sttController = this.sttControllers.get(callId);
        if (sttController) {
            await sttController.stop();
            this.sttControllers.delete(callId);
        }

        // Log call end metrics (non-blocking)
        telemetryService.logCallEnd(session);

        // Clean up Redis session state
        redisService.deleteSessionState(callId).catch(() => { });

        // Destroy the session (frees all memory)
        session.destroy();

        // Remove from active sessions map
        this.sessions.delete(callId);

        logger.info(`[Pipeline] Session destroyed — active sessions: ${this.sessions.size}`);
    }

    /**
     * Extract Call ID from the ACS WebSocket request.
     */
    private extractCallId(req: any): string {
        const url = req.url || '';

        // Try query params first (e.g. /acs-audio?callId=demo-call-001)
        const queryMatch = url.match(/[?&]callId=([^&]+)/);
        if (queryMatch) return queryMatch[1];

        // Try path segments (e.g. /acs-audio/<callId>)
        const pathParts = url.split('?')[0].split('/').filter(Boolean);
        const callIdFromPath = pathParts[pathParts.length - 1];
        if (callIdFromPath && callIdFromPath !== 'acs-audio') {
            return callIdFromPath;
        }

        // Fallback: generate a unique call ID
        return `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }

    /**
     * Get count of active sessions (for health checks / dashboard).
     */
    public getActiveSessionCount(): number {
        return this.sessions.size;
    }

    /**
     * Get session details for a specific call (for admin dashboard).
     */
    public getSessionInfo(callId: string): object | null {
        const session = this.sessions.get(callId);
        if (!session) return null;

        return {
            sessionId: session.sessionId,
            callId: session.callId,
            language: session.language,
            isProcessing: session.isProcessing,
            durationSeconds: session.getDurationSeconds(),
            totalTurns: session.metrics.totalTurns,
            languagesDetected: Array.from(session.metrics.languagesDetected),
        };
    }
}

export const audioPipeline = new AudioPipeline();
