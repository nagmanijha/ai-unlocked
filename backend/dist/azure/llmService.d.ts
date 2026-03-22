/**
 * Phase 2 — Checkpoint 6: Asynchronous LLM Streaming
 *
 * Azure OpenAI GPT-4o streaming client.
 *
 * KEY DESIGN: Returns an AsyncIterable<string> of tokens so the caller
 * can pipe them directly into the TTS chunker without waiting for the
 * full paragraph to generate. Supports AbortSignal for barge-in cancellation.
 *
 * Falls back to a mock streaming generator when Azure OpenAI is not configured.
 */
export interface LLMStreamOptions {
    messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
    }>;
    signal?: AbortSignal;
    temperature?: number;
    maxTokens?: number;
}
declare class LLMService {
    private endpoint;
    private apiKey;
    private deployment;
    constructor();
    /**
     * Stream tokens from Azure OpenAI GPT-4o.
     *
     * Returns an AsyncGenerator that yields text chunks as they are generated.
     * The caller can abort mid-stream via the AbortSignal (barge-in).
     */
    streamCompletion(options: LLMStreamOptions): AsyncGenerator<string, void, undefined>;
    /**
     * Mock streaming generator for local development.
     *
     * Generates educational responses word-by-word with realistic delays
     * to simulate GPT-4o token generation timing (~50ms per token).
     */
    private mockStream;
}
export declare const llmService: LLMService;
export {};
//# sourceMappingURL=llmService.d.ts.map