import { WebSocket } from 'ws';
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
export declare class AudioPipeline {
    private sessions;
    private sttControllers;
    constructor();
    /**
     * ═══════════════════════════════════════════════════════════════════
     * PHASE 1 — CHECKPOINT 1: Call Routing & WebSocket Initialization
     * ═══════════════════════════════════════════════════════════════════
     *
     * Called when ACS establishes a bidirectional WebSocket for a new call.
     * Creates a unique session, starts continuous STT, and begins listening.
     */
    handleConnection(ws: WebSocket, req: any): void;
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
    private onSpeechStarted;
    /**
     * ═══════════════════════════════════════════════════════════════════
     * PHASE 2 — CHECKPOINT 3: Real-Time STT & Language ID (Endpointing)
     * ═══════════════════════════════════════════════════════════════════
     *
     * Called when the STT recognizer detects the user has finished speaking
     * (silence after speech = endpointing). Triggers the full AI workflow.
     */
    private onSpeechRecognized;
    /**
     * ═══════════════════════════════════════════════════════════════════
     * THE CORE PIPELINE — Phases 2→3 orchestration
     * ═══════════════════════════════════════════════════════════════════
     *
     * Executes: RAG retrieval → Prompt assembly → LLM streaming → TTS chunking
     * All with barge-in support via AbortController.
     */
    private executeAIWorkflow;
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
    private teardownSession;
    /**
     * Extract Call ID from the ACS WebSocket request.
     */
    private extractCallId;
    /**
     * Get count of active sessions (for health checks / dashboard).
     */
    getActiveSessionCount(): number;
    /**
     * Get session details for a specific call (for admin dashboard).
     */
    getSessionInfo(callId: string): object | null;
}
export declare const audioPipeline: AudioPipeline;
//# sourceMappingURL=processAudio.d.ts.map