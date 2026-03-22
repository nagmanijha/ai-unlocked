import dotenv from 'dotenv';
dotenv.config();

/** Application configuration loaded from environment variables */
export const config = {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    // PostgreSQL
    databaseUrl: process.env.DATABASE_URL || 'postgresql://admin:password@localhost:5432/askbox_admin',

    // JWT
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',

    // Redis
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

    // Azure Cosmos DB
    cosmos: {
        endpoint: process.env.COSMOS_ENDPOINT || '',
        key: process.env.COSMOS_KEY || '',
        database: process.env.COSMOS_DATABASE || 'askbox',
        container: process.env.COSMOS_CONTAINER || 'calls',
    },

    // Azure Communication Services
    acs: {
        connectionString: process.env.ACS_CONNECTION_STRING || '',
    },

    // Azure AI Search
    search: {
        endpoint: process.env.AZURE_SEARCH_ENDPOINT || '',
        key: process.env.AZURE_SEARCH_KEY || '',
        indexName: process.env.AZURE_SEARCH_INDEX || 'askbox-knowledge',
    },

    // Google Gemini
    gemini: {
        apiKey: process.env.GEMINI_API_KEY || '',
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    },

    // Azure OpenAI
    openai: {
        key: process.env.AZURE_OPENAI_KEY || '',
        endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
        deployment: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o',
    },

    // Azure Blob Storage
    storage: {
        connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
        containerName: process.env.AZURE_STORAGE_CONTAINER || 'knowledge-base',
    },

    // Azure AI Speech (STT + TTS)
    speech: {
        key: process.env.AZURE_SPEECH_KEY || '',
        region: process.env.AZURE_SPEECH_REGION || 'centralindia',
    },

    // CORS
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
} as const;
