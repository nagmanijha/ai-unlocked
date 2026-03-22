"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallSession = void 0;
const ws_1 = require("ws");
const logger_1 = require("../config/logger");
const uuid_1 = require("uuid");
class CallSession {
    constructor(callId, ws) {
        // Mutable state
        this.language = 'en-IN';
        this.isProcessing = false;
        this.conversationHistory = [];
        // Barge-in: one AbortController per active AI turn
        this.turnAbortController = null;
        // Audio buffer for incoming PCM packets
        this.audioBuffer = [];
        this.totalAudioBytes = 0;
        // Phone metadata from ACS
        this.callerPhoneNumber = 'unknown';
        this.sessionId = (0, uuid_1.v4)();
        this.callId = callId;
        this.ws = ws;
        this.metrics = {
            sessionStartTime: Date.now(),
            totalTurns: 0,
            totalLatencyMs: 0,
            languagesDetected: new Set(['en-IN']),
            schemesAccessed: [],
        };
        logger_1.logger.info(`[Session] Created session ${this.sessionId} for Call ID: ${callId}`);
    }
    /**
     * Start a new AI turn — creates a fresh AbortController.
     * Any previous turn is automatically aborted (barge-in).
     */
    startNewTurn() {
        // If a turn is already in progress, abort it (barge-in)
        if (this.turnAbortController) {
            logger_1.logger.info(`[Session:${this.sessionId}] Barge-in detected — aborting current turn`);
            this.turnAbortController.abort();
        }
        this.turnAbortController = new AbortController();
        this.isProcessing = true;
        this.metrics.totalTurns++;
        return this.turnAbortController;
    }
    /**
     * End the current AI turn — clears the AbortController and audio buffer.
     */
    endTurn() {
        this.turnAbortController = null;
        this.isProcessing = false;
        this.audioBuffer = [];
        this.totalAudioBytes = 0;
    }
    /**
     * Append audio data to the session buffer.
     * Phase 1 — Checkpoint 2: Audio Packet Decoding & Buffering
     */
    pushAudio(chunk) {
        this.audioBuffer.push(chunk);
        this.totalAudioBytes += chunk.length;
    }
    /**
     * Add a conversation turn (user or assistant) to history.
     * Keeps last 10 turns to fit within GPT-4o context window.
     */
    addTurn(role, content) {
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
    setLanguage(lang) {
        this.language = lang;
        this.metrics.languagesDetected.add(lang);
    }
    /**
     * Check if the WebSocket is still alive.
     */
    isAlive() {
        return this.ws.readyState === ws_1.WebSocket.OPEN;
    }
    /**
     * Send an audio packet back to the caller via ACS WebSocket.
     * Phase 3 — Checkpoint 8: Audio Stream Playback to ACS
     */
    sendAudio(audioBuffer) {
        if (!this.isAlive())
            return false;
        try {
            this.ws.send(JSON.stringify({
                kind: 'AudioData',
                audioData: {
                    data: audioBuffer.toString('base64'),
                    encoding: 'base64',
                    sampleRate: 16000,
                    channels: 1,
                },
            }));
            return true;
        }
        catch (err) {
            logger_1.logger.error(`[Session:${this.sessionId}] Failed to send audio`, err);
            return false;
        }
    }
    /**
     * Send a "stop playing" signal to ACS — used for barge-in.
     * Phase 3 — Checkpoint 9: Interruption & Barge-in Handling
     */
    sendStopAudio() {
        if (!this.isAlive())
            return;
        try {
            this.ws.send(JSON.stringify({
                kind: 'StopAudio',
                stopAudio: {
                    playbackTerminated: true,
                },
            }));
            logger_1.logger.info(`[Session:${this.sessionId}] Sent StopAudio signal (barge-in)`);
        }
        catch (err) {
            logger_1.logger.error(`[Session:${this.sessionId}] Failed to send StopAudio`, err);
        }
    }
    /**
     * Get session duration in seconds.
     */
    getDurationSeconds() {
        return Math.round((Date.now() - this.metrics.sessionStartTime) / 1000);
    }
    /**
     * Clean up all resources when the call ends.
     * Phase 4 — Checkpoint 10: Graceful Disconnect
     */
    destroy() {
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
        logger_1.logger.info(`[Session:${this.sessionId}] Destroyed — duration: ${this.getDurationSeconds()}s, turns: ${this.metrics.totalTurns}`);
    }
}
exports.CallSession = CallSession;
//# sourceMappingURL=callSession.js.map