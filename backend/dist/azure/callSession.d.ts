import { WebSocket } from 'ws';
/**
 * Phase 1 — Checkpoint 1: Call Routing & WebSocket Initialization
 *
 * Manages the full lifecycle of a single voice call session.
 * Each incoming ACS WebSocket connection creates one CallSession.
 *
 * KEY DESIGN DECISIONS:
 * - AbortController per "turn" so barge-in can cancel LLM+TTS mid-stream
 * - Conversation history kept in-memory (synced to Redis for persistence)
 * - Language state is mutable — updated by STT Language ID on every utterance
 */
export interface ConversationTurn {
    role: 'user' | 'assistant';
    content: string;
    language: string;
    timestamp: number;
}
export interface SessionMetrics {
    sessionStartTime: number;
    totalTurns: number;
    totalLatencyMs: number;
    languagesDetected: Set<string>;
    schemesAccessed: string[];
}
export declare class CallSession {
    readonly sessionId: string;
    readonly callId: string;
    readonly ws: WebSocket;
    language: string;
    isProcessing: boolean;
    conversationHistory: ConversationTurn[];
    turnAbortController: AbortController | null;
    audioBuffer: Buffer[];
    totalAudioBytes: number;
    metrics: SessionMetrics;
    callerPhoneNumber: string;
    constructor(callId: string, ws: WebSocket);
    /**
     * Start a new AI turn — creates a fresh AbortController.
     * Any previous turn is automatically aborted (barge-in).
     */
    startNewTurn(): AbortController;
    /**
     * End the current AI turn — clears the AbortController and audio buffer.
     */
    endTurn(): void;
    /**
     * Append audio data to the session buffer.
     * Phase 1 — Checkpoint 2: Audio Packet Decoding & Buffering
     */
    pushAudio(chunk: Buffer): void;
    /**
     * Add a conversation turn (user or assistant) to history.
     * Keeps last 10 turns to fit within GPT-4o context window.
     */
    addTurn(role: 'user' | 'assistant', content: string): void;
    /**
     * Update the detected language — called after STT Language ID.
     */
    setLanguage(lang: string): void;
    /**
     * Check if the WebSocket is still alive.
     */
    isAlive(): boolean;
    /**
     * Send an audio packet back to the caller via ACS WebSocket.
     * Phase 3 — Checkpoint 8: Audio Stream Playback to ACS
     */
    sendAudio(audioBuffer: Buffer): boolean;
    /**
     * Send a "stop playing" signal to ACS — used for barge-in.
     * Phase 3 — Checkpoint 9: Interruption & Barge-in Handling
     */
    sendStopAudio(): void;
    /**
     * Get session duration in seconds.
     */
    getDurationSeconds(): number;
    /**
     * Clean up all resources when the call ends.
     * Phase 4 — Checkpoint 10: Graceful Disconnect
     */
    destroy(): void;
}
//# sourceMappingURL=callSession.d.ts.map