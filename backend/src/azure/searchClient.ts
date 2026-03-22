import { SearchClient, AzureKeyCredential } from '@azure/search-documents';
import { config } from '../config';
import { logger } from '../config/logger';

/**
 * Azure AI Search client wrapper.
 * Used for triggering knowledge base indexing operations.
 * 
 * NOTE: Replace placeholder credentials with real Azure AI Search credentials.
 */
class SearchService {
    private client: SearchClient<any> | null = null;

    /** Initialize Search client. Call once at startup. */
    initialize(): void {
        if (!config.search.endpoint || !config.search.key) {
            logger.warn('Azure AI Search credentials not configured — using mock mode');
            return;
        }

        try {
            this.client = new SearchClient(
                config.search.endpoint,
                config.search.indexName,
                new AzureKeyCredential(config.search.key)
            );
            logger.info('Azure AI Search client initialized');
        } catch (error) {
            logger.error('Failed to initialize Azure AI Search', { error });
        }
    }

    /** Get the search client */
    getClient(): SearchClient<any> | null {
        return this.client;
    }

    /** Check if search service is connected */
    isConnected(): boolean {
        return this.client !== null;
    }
}

export const searchService = new SearchService();
