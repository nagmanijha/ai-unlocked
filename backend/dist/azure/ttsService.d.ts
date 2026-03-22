export interface TTSChunk {
    text: string;
    audioBuffer: Buffer;
    durationMs: number;
}
declare class TTSService {
    private speechKey;
    private speechRegion;
    constructor();
    /**
     * Synthesize a text chunk into PCM audio using Azure Neural TTS.
     *
     * @param text      The text chunk to synthesize
     * @param language  The target language code (e.g. "hi-IN")
     * @returns         PCM audio buffer (16kHz, 16-bit, mono)
     */
    synthesize(text: string, language: string): Promise<Buffer>;
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
    createChunker(): TextChunker;
    /**
     * Get the voice name for a given language.
     */
    getVoiceName(language: string): string;
    /**
     * Mock TTS for local development.
     * Generates realistic-duration silent PCM audio based on text length.
     */
    private mockSynthesize;
    /**
     * Generate a silent PCM buffer of the given size.
     * Used as fallback when real TTS is unavailable.
     */
    private generateSilence;
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
export declare class TextChunker {
    private buffer;
    private minChunkLength;
    private maxChunkLength;
    /**
     * Add a token from the LLM stream. Returns a chunk if a natural
     * boundary was detected, or null if still accumulating.
     */
    addToken(token: string): string | null;
    /**
     * Flush any remaining text in the buffer (called at end of LLM stream).
     */
    flush(): string | null;
}
export declare const ttsService: TTSService;
export {};
//# sourceMappingURL=ttsService.d.ts.map