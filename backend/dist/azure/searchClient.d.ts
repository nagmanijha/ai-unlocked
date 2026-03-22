import { SearchClient } from '@azure/search-documents';
/**
 * Azure AI Search client wrapper.
 * Used for triggering knowledge base indexing operations.
 *
 * NOTE: Replace placeholder credentials with real Azure AI Search credentials.
 */
declare class SearchService {
    private client;
    /** Initialize Search client. Call once at startup. */
    initialize(): void;
    /** Get the search client */
    getClient(): SearchClient<any> | null;
    /** Check if search service is connected */
    isConnected(): boolean;
}
export declare const searchService: SearchService;
export {};
//# sourceMappingURL=searchClient.d.ts.map