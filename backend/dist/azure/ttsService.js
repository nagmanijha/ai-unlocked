"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ttsService = exports.TextChunker = void 0;
const logger_1 = require("../config/logger");
const config_1 = require("../config");
/**
 * Phase 3 — Checkpoint 7 & 8: Semantic TTS Chunking + Audio Playback
 *
 * Azure Neural TTS with:
 * 1. SEMANTIC CHUNKING: Buffers incoming LLM tokens until a natural sentence
 *    boundary (period, question mark, comma, etc.), then synthesizes just
 *    that chunk. This is the key to sub-second TTFB.
 * 2. DYNAMIC VOICE: Selects the correct Azure Neural Voice for the detected
 *    Indian language so the response sounds natural.
 * 3. Returns PCM audio buffers ready for WebSocket transmission to ACS.
 *
 * Falls back to mock TTS (silent PCM frames) when Azure Speech is not configured.
 */
/**
 * Map of language codes to Azure Neural TTS voice names.
 * Each voice is a high-quality Neural voice optimized for the language.
 */
const VOICE_MAP = {
    'en-IN': 'en-IN-NeerjaNeural',
    'hi-IN': 'hi-IN-SwaraNeural',
    'ta-IN': 'ta-IN-PallaviNeural',
    'te-IN': 'te-IN-ShrutiNeural',
    'kn-IN': 'kn-IN-SapnaNeural',
    'ml-IN': 'ml-IN-SobhanaNeural',
    'bn-IN': 'bn-IN-TanishaaNeural',
    'mr-IN': 'mr-IN-AarohiNeural',
};
/** Natural sentence boundaries for chunking */
const SENTENCE_BOUNDARIES = /[.!?।]\s*/;
const CLAUSE_BOUNDARIES = /[,;:]\s*/;
class TTSService {
    constructor() {
        this.speechKey = config_1.config.speech?.key || '';
        this.speechRegion = config_1.config.speech?.region || '';
    }
    /**
     * Synthesize a text chunk into PCM audio using Azure Neural TTS.
     *
     * @param text      The text chunk to synthesize
     * @param language  The target language code (e.g. "hi-IN")
     * @returns         PCM audio buffer (16kHz, 16-bit, mono)
     */
    async synthesize(text, language) {
        if (!this.speechKey || !this.speechRegion) {
            return this.mockSynthesize(text, language);
        }
        try {
            const sdk = require('microsoft-cognitiveservices-speech-sdk');
            const voiceName = VOICE_MAP[language] || VOICE_MAP['en-IN'];
            const speechConfig = sdk.SpeechConfig.fromSubscription(this.speechKey, this.speechRegion);
            speechConfig.speechSynthesisVoiceName = voiceName;
            speechConfig.speechSynthesisOutputFormat =
                sdk.SpeechSynthesisOutputFormat.Raw16Khz16BitMonoPcm;
            // Use pull stream to capture audio to a buffer
            const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null);
            return new Promise((resolve, reject) => {
                synthesizer.speakTextAsync(text, (result) => {
                    if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                        const audioData = result.audioData;
                        const buffer = Buffer.from(audioData);
                        synthesizer.close();
                        resolve(buffer);
                    }
                    else {
                        synthesizer.close();
                        logger_1.logger.error('[TTS] Synthesis failed', {
                            reason: result.reason,
                            errorDetails: result.errorDetails,
                        });
                        // Return silent audio rather than nothing
                        resolve(this.generateSilence(text.length * 50));
                    }
                }, (err) => {
                    synthesizer.close();
                    logger_1.logger.error('[TTS] Synthesis error', err);
                    reject(err);
                });
            });
        }
        catch (error) {
            logger_1.logger.error('[TTS] Azure TTS unavailable, using mock', error);
            return this.mockSynthesize(text, language);
        }
    }
    /**
     * Create a semantic text chunker that buffers LLM tokens and yields
     * complete sentence/clause chunks suitable for TTS.
     *
     * Phase 3 — Checkpoint 7: Semantic TTS Chunking
     *
     * WHY: Feeding individual words to TTS sounds choppy. Feeding the entire
     * response adds massive latency. Chunking at natural sentence boundaries
     * gives the best of both worlds: natural-sounding speech with low TTFB.
     */
    createChunker() {
        return new TextChunker();
    }
    /**
     * Get the voice name for a given language.
     */
    getVoiceName(language) {
        return VOICE_MAP[language] || VOICE_MAP['en-IN'];
    }
    /**
     * Mock TTS for local development.
     * Generates realistic-duration silent PCM audio based on text length.
     */
    async mockSynthesize(text, language) {
        const voiceName = VOICE_MAP[language] || 'en-IN-NeerjaNeural';
        logger_1.logger.debug(`[TTS:Mock] Synthesizing "${text.slice(0, 50)}..." with ${voiceName}`);
        // Simulate TTS processing time (~20ms per word)
        const wordCount = text.split(/\s+/).length;
        await new Promise(r => setTimeout(r, Math.min(wordCount * 15, 200)));
        // Generate PCM audio buffer sized to approximate speech duration
        // Average speaking rate: ~150 words/min = ~2.5 words/sec
        // At 16kHz 16-bit mono: 32,000 bytes/sec
        const durationSec = wordCount / 2.5;
        const bufferSize = Math.round(durationSec * 32000);
        return this.generateSilence(bufferSize);
    }
    /**
     * Generate a silent PCM buffer of the given size.
     * Used as fallback when real TTS is unavailable.
     */
    generateSilence(bytes) {
        return Buffer.alloc(Math.max(bytes, 1024), 0);
    }
}
/**
 * TextChunker — buffers streaming LLM tokens and yields natural chunks.
 *
 * Strategy:
 * 1. Accumulate tokens into a buffer
 * 2. When a sentence boundary is detected, yield the complete sentence
 * 3. If the buffer exceeds 100 chars without a sentence boundary,
 *    yield at the nearest clause boundary (comma, semicolon)
 * 4. On flush(), yield any remaining text
 */
class TextChunker {
    constructor() {
        this.buffer = '';
        this.minChunkLength = 20; // Don't yield tiny fragments
        this.maxChunkLength = 150; // Force yield after this many chars
    }
    /**
     * Add a token from the LLM stream. Returns a chunk if a natural
     * boundary was detected, or null if still accumulating.
     */
    addToken(token) {
        this.buffer += token;
        // Check for sentence boundaries
        if (this.buffer.length >= this.minChunkLength) {
            const sentenceMatch = this.buffer.match(SENTENCE_BOUNDARIES);
            if (sentenceMatch && sentenceMatch.index !== undefined) {
                const endIdx = sentenceMatch.index + sentenceMatch[0].length;
                const chunk = this.buffer.slice(0, endIdx).trim();
                this.buffer = this.buffer.slice(endIdx);
                if (chunk.length > 0)
                    return chunk;
            }
        }
        // Force yield at clause boundary if buffer is getting long
        if (this.buffer.length >= this.maxChunkLength) {
            const clauseMatch = this.buffer.match(CLAUSE_BOUNDARIES);
            if (clauseMatch && clauseMatch.index !== undefined) {
                const endIdx = clauseMatch.index + clauseMatch[0].length;
                const chunk = this.buffer.slice(0, endIdx).trim();
                this.buffer = this.buffer.slice(endIdx);
                if (chunk.length > 0)
                    return chunk;
            }
            // No boundary found — force yield at a word boundary
            const lastSpace = this.buffer.lastIndexOf(' ');
            if (lastSpace > this.minChunkLength) {
                const chunk = this.buffer.slice(0, lastSpace).trim();
                this.buffer = this.buffer.slice(lastSpace + 1);
                if (chunk.length > 0)
                    return chunk;
            }
        }
        return null;
    }
    /**
     * Flush any remaining text in the buffer (called at end of LLM stream).
     */
    flush() {
        const remaining = this.buffer.trim();
        this.buffer = '';
        return remaining.length > 0 ? remaining : null;
    }
}
exports.TextChunker = TextChunker;
exports.ttsService = new TTSService();
//# sourceMappingURL=ttsService.js.map