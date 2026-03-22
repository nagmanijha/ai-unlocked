"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cosmosService = void 0;
const cosmos_1 = require("@azure/cosmos");
const config_1 = require("../config");
const logger_1 = require("../config/logger");
/**
 * Azure Cosmos DB client wrapper.
 * Provides access to the calls container for reading call logs.
 *
 * NOTE: Replace placeholder credentials with real Azure Cosmos DB credentials.
 */
class CosmosService {
    constructor() {
        this.client = null;
        this.database = null;
        this.container = null;
    }
    /** Initialize Cosmos DB client. Call once at startup. */
    async initialize() {
        if (!config_1.config.cosmos.endpoint || !config_1.config.cosmos.key) {
            logger_1.logger.warn('Cosmos DB credentials not configured — using mock data');
            return;
        }
        try {
            this.client = new cosmos_1.CosmosClient({
                endpoint: config_1.config.cosmos.endpoint,
                key: config_1.config.cosmos.key,
            });
            this.database = this.client.database(config_1.config.cosmos.database);
            this.container = this.database.container(config_1.config.cosmos.container);
            logger_1.logger.info('Cosmos DB client initialized');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize Cosmos DB', { error });
        }
    }
    /** Get the calls container */
    getContainer() {
        return this.container;
    }
    /** Check if Cosmos DB is connected */
    isConnected() {
        return this.container !== null;
    }
}
exports.cosmosService = new CosmosService();
//# sourceMappingURL=cosmosClient.js.map