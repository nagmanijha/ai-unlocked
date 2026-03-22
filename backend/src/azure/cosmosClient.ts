import { CosmosClient, Container, Database } from '@azure/cosmos';
import { config } from '../config';
import { logger } from '../config/logger';

/**
 * Azure Cosmos DB client wrapper.
 * Provides access to the calls container for reading call logs.
 * 
 * NOTE: Replace placeholder credentials with real Azure Cosmos DB credentials.
 */
class CosmosService {
    private client: CosmosClient | null = null;
    private database: Database | null = null;
    private container: Container | null = null;

    /** Initialize Cosmos DB client. Call once at startup. */
    async initialize(): Promise<void> {
        if (!config.cosmos.endpoint || !config.cosmos.key) {
            logger.warn('Cosmos DB credentials not configured — using mock data');
            return;
        }

        try {
            this.client = new CosmosClient({
                endpoint: config.cosmos.endpoint,
                key: config.cosmos.key,
            });
            this.database = this.client.database(config.cosmos.database);
            this.container = this.database.container(config.cosmos.container);
            logger.info('Cosmos DB client initialized');
        } catch (error) {
            logger.error('Failed to initialize Cosmos DB', { error });
        }
    }

    /** Get the calls container */
    getContainer(): Container | null {
        return this.container;
    }

    /** Check if Cosmos DB is connected */
    isConnected(): boolean {
        return this.container !== null;
    }
}

export const cosmosService = new CosmosService();
