import { logger } from '../config/logger';
import { config } from '../config';

/**
 * Phase 2 — Checkpoint 6: Asynchronous LLM Streaming
 *
 * Supports Azure OpenAI and Google Gemini via REST API (SSE streaming).
 *
 * KEY DESIGN: Returns an AsyncIterable<string> of tokens so the caller
 * can pipe them directly into the TTS chunker without waiting for the
 * full paragraph to generate. Supports AbortSignal for barge-in cancellation.
 *
 * Falls back to a mock streaming generator when API keys are not set.
 *
 * API reference:
 *   POST https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent
 *   Docs: https://ai.google.dev/api/generate-content#v1beta.models.streamGenerateContent
 */

export interface LLMStreamOptions {
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    signal?: AbortSignal;
    temperature?: number;
    maxTokens?: number;
}

/** Convert our internal message format to Gemini's "contents" format */
function toGeminiContents(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
): { systemInstruction?: string; contents: Array<{ role: string; parts: Array<{ text: string }> }> } {
    // Gemini separates the system prompt from the conversation turns
    const systemMsg = messages.find((m) => m.role === 'system');
    const turns = messages.filter((m) => m.role !== 'system');

    const contents = turns.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
    }));

    return {
        systemInstruction: systemMsg?.content,
        contents,
    };
}

class LLMService {
    private geminiApiKey: string;
    private geminiModel: string;
    private geminiBaseUrl: string;

    private azureOpenAIKey: string;
    private azureOpenAIEndpoint: string;
    private azureOpenAIDeployment: string;

    constructor() {
        this.geminiApiKey = config.gemini.apiKey;
        this.geminiModel = config.gemini.model;
        this.geminiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta';

        this.azureOpenAIKey = config.openai.key;
        this.azureOpenAIEndpoint = config.openai.endpoint;
        this.azureOpenAIDeployment = config.openai.deployment;
    }

    /**
     * Stream tokens from selected LLM provider.
     * Prefers Azure OpenAI, falls back to Gemini, then Mock.
     * Supports AbortSignal for barge-in.
     */
    async *streamCompletion(options: LLMStreamOptions): AsyncGenerator<string, void, undefined> {
        if (this.azureOpenAIKey && this.azureOpenAIEndpoint) {
            logger.info('[LLM] Using Azure OpenAI');
            yield* this.streamAzureOpenAI(options);
            return;
        }

        if (this.geminiApiKey) {
            logger.info('[LLM] Using Google Gemini');
            yield* this.streamGemini(options);
            return;
        }

        logger.warn('[LLM] No LLM API keys set — using mock stream');
        yield* this.mockStream(options.messages, options.signal);
    }

    /**
     * Generate a complete text response synchronously (no streaming).
     * Used for background tasks like summarizing transcripts without a WebSocket.
     */
    async generateCompletion(options: LLMStreamOptions): Promise<string> {
        let fullResponse = '';
        const stream = this.streamCompletion(options);
        for await (const token of stream) {
            fullResponse += token;
        }
        return fullResponse;
    }

    private async *streamAzureOpenAI(options: LLMStreamOptions): AsyncGenerator<string, void, undefined> {
        const { messages, signal, maxTokens = 800 } = options;
        const endpoint = this.azureOpenAIEndpoint.replace(/\/$/, "");
        const url = `${endpoint}/openai/deployments/${this.azureOpenAIDeployment}/chat/completions?api-version=2024-02-15-preview`;

        const body = {
            messages,
            temperature: 1,
            max_completion_tokens: maxTokens,
            stream: true,
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': this.azureOpenAIKey,
                },
                body: JSON.stringify(body),
                signal,
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Azure OpenAI SDK Error ${response.status}: ${errText}`);
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No response body reader');

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                if (signal?.aborted) {
                    logger.info('[LLM] Stream aborted (barge-in)');
                    reader.cancel();
                    return;
                }

                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith('data: ')) continue;

                    const jsonStr = trimmed.slice(6).trim();
                    if (!jsonStr || jsonStr === '[DONE]') continue;

                    try {
                        const chunk = JSON.parse(jsonStr);
                        const text = chunk?.choices?.[0]?.delta?.content;
                        if (text) {
                            yield text;
                        }
                    } catch {
                        // skip
                    }
                }
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                logger.info('[LLM] Stream aborted by AbortSignal');
                return;
            }
            logger.error('[LLM] Azure OpenAI streaming failed', error);
            yield 'I am sorry, I am having trouble answering right now. Please try again in a moment.';
        }
    }

    private async *streamGemini(options: LLMStreamOptions): AsyncGenerator<string, void, undefined> {
        const { messages, signal, temperature = 0.7, maxTokens = 800 } = options;

        const { systemInstruction, contents } = toGeminiContents(messages);

        const url = `${this.geminiBaseUrl}/models/${this.geminiModel}:streamGenerateContent?key=${this.geminiApiKey}&alt=sse`;

        const body: Record<string, any> = {
            contents,
            generationConfig: {
                temperature,
                maxOutputTokens: maxTokens,
            },
        };

        if (systemInstruction) {
            body.systemInstruction = {
                parts: [{ text: systemInstruction }],
            };
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal,
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Gemini API error ${response.status}: ${errText}`);
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No response body reader');

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                if (signal?.aborted) {
                    logger.info('[LLM] Stream aborted (barge-in)');
                    reader.cancel();
                    return;
                }

                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                const lines = buffer.split('\n');
                buffer = lines.pop() ?? ''; // keep incomplete line

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith('data: ')) continue;

                    const jsonStr = trimmed.slice(6).trim();
                    if (!jsonStr || jsonStr === '[DONE]') continue;

                    try {
                        const chunk = JSON.parse(jsonStr);
                        const text: string | undefined =
                            chunk?.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (text) {
                            yield text;
                        }
                    } catch {
                        // Skip malformed JSON chunks (can happen on first/last packet)
                    }
                }
            }

        } catch (error: any) {
            if (error.name === 'AbortError') {
                logger.info('[LLM] Stream aborted by AbortSignal');
                return;
            }
            logger.error('[LLM] Gemini streaming failed', error);
            // Yield a graceful fallback so the caller doesn't hear silence
            yield 'I am sorry, I am having trouble answering right now. Please try again in a moment.';
        }
    }

    /**
     * Mock streaming generator for local development (no API key needed).
     *
     * Generates educational responses word-by-word with realistic delays
     * to simulate Gemini token generation timing (~40ms per token).
     */
    private async *mockStream(
        messages: Array<{ role: string; content: string }>,
        signal?: AbortSignal
    ): AsyncGenerator<string, void, undefined> {
        const userMessage = messages[messages.length - 1]?.content || '';
        const lower = userMessage.toLowerCase();

        let response: string;

        if (lower.includes('photosynthesis')) {
            response = 'Photosynthesis is the process by which green plants convert sunlight, water, and carbon dioxide into glucose and oxygen. It happens in the chloroplast of plant cells. This is how plants make their own food!';
        } else if (lower.includes('newton')) {
            response = "Newton's third law states that for every action, there is an equal and opposite reaction. For example, when you push a wall, the wall pushes back on you with the same force.";
        } else if (lower.includes('pradhan mantri') || lower.includes('yojana') || lower.includes('scheme')) {
            response = 'Pradhan Mantri Awas Yojana provides affordable housing to economically weaker sections. If your family income is below three lakh rupees per year, you can apply at your nearest Common Service Centre or the panchayat office.';
        } else if (lower.includes('solar') || lower.includes('planet')) {
            response = 'Our solar system has eight planets. The four inner planets are Mercury, Venus, Earth, and Mars. The four outer planets are Jupiter, Saturn, Uranus, and Neptune. Earth is the only planet known to support life.';
        } else if (lower.includes('water') || lower.includes('pani') || lower.includes('cycle')) {
            response = 'The water cycle has four stages. First, water evaporates from rivers and oceans. Then, it condenses into clouds. Next, it falls back as rain or snow. Finally, it collects in rivers, lakes, and oceans, and the cycle repeats.';
        } else {
            response = 'That is a great question! Based on your curriculum, this topic is covered in detail in your NCERT textbook. I recommend reviewing the chapter carefully and practicing the exercises at the end.';
        }

        const words = response.split(' ');
        for (let i = 0; i < words.length; i++) {
            if (signal?.aborted) {
                logger.info('[LLM:Mock] Stream aborted (barge-in)');
                return;
            }
            yield words[i] + (i < words.length - 1 ? ' ' : '');
            await new Promise(r => setTimeout(r, 30 + Math.random() * 30));
        }
    }
}

export const llmService = new LLMService();
