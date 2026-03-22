import type { ConversationTurn } from './callSession';
export interface AssembledPrompt {
    messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
    }>;
    context: string;
    retrievalSource: 'cache' | 'search' | 'fallback';
    retrievalLatencyMs: number;
}
declare class RAGService {
    /**
     * Full RAG pipeline: retrieve context → assemble prompt.
     *
     * @param query        The user's transcribed question
     * @param language     Detected language (e.g. "hi-IN")
     * @param history      Conversation history for multi-turn context
     */
    retrieveAndAssemble(query: string, language: string, history: ConversationTurn[]): Promise<AssembledPrompt>;
    /**
     * Two-tier context retrieval with timeout fallback.
     */
    private retrieveContext;
    /**
     * Query Azure AI Search with a strict timeout.
     * If the search takes too long, we abort and fall back to generic LLM response
     * rather than keeping the caller waiting in silence.
     */
    private searchWithTimeout;
    /**
     * Mock context provider for local development.
     * Returns relevant educational or scheme content based on keywords.
     */
    private getMockContext;
    /**
     * Map language codes to human-readable names for the system prompt.
     */
    private getLanguageName;
}
export declare const ragService: RAGService;
export {};
//# sourceMappingURL=ragService.d.ts.map