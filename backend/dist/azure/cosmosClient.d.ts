import { Container } from '@azure/cosmos';
/**
 * Azure Cosmos DB client wrapper.
 * Provides access to the calls container for reading call logs.
 *
 * NOTE: Replace placeholder credentials with real Azure Cosmos DB credentials.
 */
declare class CosmosService {
    private client;
    private database;
    private container;
    /** Initialize Cosmos DB client. Call once at startup. */
    initialize(): Promise<void>;
    /** Get the calls container */
    getContainer(): Container | null;
    /** Check if Cosmos DB is connected */
    isConnected(): boolean;
}
export declare const cosmosService: CosmosService;
export {};
//# sourceMappingURL=cosmosClient.d.ts.map