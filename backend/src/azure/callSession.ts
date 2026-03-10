import { WebSocket } from 'ws';
import { logger } from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

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

export class CallSession {
    public readonly sessionId: string;
    public readonly callId: string;
    public readonly ws: WebSocket;

    // Mutable state
    public language: string = 'en-IN';
    public isProcessing: boolean = false;
    public conversationHistory: ConversationTurn[] = [];

    // Barge-in: one AbortController per active AI turn
    public turnAbortController: AbortController | null = null;

    // Audio buffer for incoming PCM packets
    public audioBuffer: Buffer[] = [];
    public totalAudioBytes: number = 0;

    // Telemetry
    public metrics: SessionMetrics;

    // Phone metadata from ACS
    public callerPhoneNumber: string = 'unknown';

    constructor(callId: string, ws: WebSocket) {
        this.sessionId = uuidv4();
        this.callId = callId;
        this.ws = ws;
        this.metrics = {
            sessionStartTime: Date.now(),
            totalTurns: 0,
            totalLatencyMs: 0,
            languagesDetected: new Set(['en-IN']),
            schemesAccessed: [],
        };

        logger.info(`[Session] Created session ${this.sessionId} for Call ID: ${callId}`);
    }

    /**
     * Start a new AI turn — creates a fresh AbortController.
     * Any previous turn is automatically aborted (barge-in).
     */
    public startNewTurn(): AbortController {
        // If a turn is already in progress, abort it (barge-in)
        if (this.turnAbortController) {
            this.abortCurrentTurn();
        }

        this.turnAbortController = new AbortController();
        this.isProcessing = true;
        this.metrics.totalTurns++;
        return this.turnAbortController;
    }

    /**
     * Abort the current AI turn without starting a new one.
     * Used for barge-in protection.
     */
    public abortCurrentTurn(): void {
        if (this.turnAbortController) {
            logger.info(`[Session:${this.sessionId}] Aborting current turn (barge-in)`);
            this.turnAbortController.abort();
            this.turnAbortController = null;
        }
    }

    /**
     * End the current AI turn — clears the AbortController and audio buffer.
     */
    public endTurn(): void {
        this.turnAbortController = null;
        this.isProcessing = false;
        this.audioBuffer = [];
        this.totalAudioBytes = 0;
    }

    /**
     * Append audio data to the session buffer.
     * Phase 1 — Checkpoint 2: Audio Packet Decoding & Buffering
     */
    public pushAudio(chunk: Buffer): void {
        this.audioBuffer.push(chunk);
        this.totalAudioBytes += chunk.length;
    }

    /**
     * Add a conversation turn (user or assistant) to history.
     * Keeps last 10 turns to fit within GPT-4o context window.
     */
    public addTurn(role: 'user' | 'assistant', content: string): void {
        this.conversationHistory.push({
            role,
            content,
            language: this.language,
            timestamp: Date.now(),
        });

        // Keep only the last 10 turns to manage context window
        if (this.conversationHistory.length > 10) {
            this.conversationHistory = this.conversationHistory.slice(-10);
        }
    }

    /**
     * Update the detected language — called after STT Language ID.
     */
    public setLanguage(lang: string): void {
        this.language = lang;
        this.metrics.languagesDetected.add(lang);
    }

    /**
     * Check if the WebSocket is still alive.
     */
    public isAlive(): boolean {
        return this.ws.readyState === WebSocket.OPEN;
    }

    /**
     * Send an audio packet back to the caller via ACS WebSocket.
     * Phase 3 — Checkpoint 8: Audio Stream Playback to ACS
     */
    public sendAudio(audioBuffer: Buffer): boolean {
        if (!this.isAlive()) return false;

        try {
            this.ws.send(JSON.stringify({
                kind: 'AudioData',
                audioData: {
                    data: audioBuffer.toString('base64'),
                    encoding: 'PCM-16K-16B-MONO',
                    sampleRate: 16000,
                    channels: 1,
                },
            }));
            return true;
        } catch (err) {
            logger.error(`[Session:${this.sessionId}] Failed to send audio`, err);
            return false;
        }
    }

    /**
     * Send a "stop playing" signal to ACS — used for barge-in.
     * Phase 3 — Checkpoint 9: Interruption & Barge-in Handling
     */
    public sendStopAudio(): void {
        if (!this.isAlive()) return;

        try {
            this.ws.send(JSON.stringify({
                kind: 'StopAudio',
                stopAudio: {
                    playbackTerminated: true,
                },
            }));
            logger.info(`[Session:${this.sessionId}] Sent StopAudio signal (barge-in)`);
        } catch (err) {
            logger.error(`[Session:${this.sessionId}] Failed to send StopAudio`, err);
        }
    }

    /**
     * Get session duration in seconds.
     */
    public getDurationSeconds(): number {
        return Math.round((Date.now() - this.metrics.sessionStartTime) / 1000);
    }

    /**
     * Clean up all resources when the call ends.
     * Phase 4 — Checkpoint 10: Graceful Disconnect
     */
    public destroy(): void {
        // Abort any in-progress AI turn
        if (this.turnAbortController) {
            this.turnAbortController.abort();
            this.turnAbortController = null;
        }

        // Clear buffers to free memory on AMD server
        this.audioBuffer = [];
        this.totalAudioBytes = 0;
        this.conversationHistory = [];
        this.isProcessing = false;

        logger.info(`[Session:${this.sessionId}] Destroyed — duration: ${this.getDurationSeconds()}s, turns: ${this.metrics.totalTurns}`);
    }
}
