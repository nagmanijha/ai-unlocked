"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchService = void 0;
const search_documents_1 = require("@azure/search-documents");
const config_1 = require("../config");
const logger_1 = require("../config/logger");
/**
 * Azure AI Search client wrapper.
 * Used for triggering knowledge base indexing operations.
 *
 * NOTE: Replace placeholder credentials with real Azure AI Search credentials.
 */
class SearchService {
    constructor() {
        this.client = null;
    }
    /** Initialize Search client. Call once at startup. */
    initialize() {
        if (!config_1.config.search.endpoint || !config_1.config.search.key) {
            logger_1.logger.warn('Azure AI Search credentials not configured — using mock mode');
            return;
        }
        try {
            this.client = new search_documents_1.SearchClient(config_1.config.search.endpoint, config_1.config.search.indexName, new search_documents_1.AzureKeyCredential(config_1.config.search.key));
            logger_1.logger.info('Azure AI Search client initialized');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize Azure AI Search', { error });
        }
    }
    /** Get the search client */
    getClient() {
        return this.client;
    }
    /** Check if search service is connected */
    isConnected() {
        return this.client !== null;
    }
}
exports.searchService = new SearchService();
//# sourceMappingURL=searchClient.js.map