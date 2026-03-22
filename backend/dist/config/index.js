"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
/** Application configuration loaded from environment variables */
exports.config = {
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
    // Azure OpenAI
    openai: {
        endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
        key: process.env.AZURE_OPENAI_KEY || '',
        deployment: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4',
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
};
//# sourceMappingURL=index.js.map