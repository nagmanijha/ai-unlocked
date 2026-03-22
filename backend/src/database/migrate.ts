import { pool } from './connection';
import { logger } from '../config/logger';

/**
 * Database migration script.
 * Creates all required tables for the AskBox admin application.
 * Idempotent — safe to run multiple times.
 */
async function runMigrations(): Promise<void> {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Enable UUID extension
        await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

        // Admin users table
        await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'viewer')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

        // Knowledge base documents table
        await client.query(`
      CREATE TABLE IF NOT EXISTS knowledge_base_documents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type VARCHAR(50) NOT NULL,
        storage_url TEXT,
        indexing_status VARCHAR(20) NOT NULL DEFAULT 'pending'
          CHECK (indexing_status IN ('pending', 'indexing', 'indexed', 'failed')),
        uploaded_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

        // System configurations table
        await client.query(`
      CREATE TABLE IF NOT EXISTS system_configurations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        key VARCHAR(100) UNIQUE NOT NULL,
        value JSONB NOT NULL DEFAULT '{}',
        description TEXT,
        updated_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

        // Analytics cache table
        await client.query(`
      CREATE TABLE IF NOT EXISTS analytics_cache (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        metric_type VARCHAR(50) NOT NULL,
        period VARCHAR(20) NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly')),
        data JSONB NOT NULL DEFAULT '{}',
        computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `);

        // Create indexes for performance
        await client.query('CREATE INDEX IF NOT EXISTS idx_kb_docs_status ON knowledge_base_documents(indexing_status)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_sys_config_key ON system_configurations(key)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_cache(metric_type, period)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_analytics_expires ON analytics_cache(expires_at)');

        // Seed default system configurations
        await client.query(`
      INSERT INTO system_configurations (key, value, description) VALUES
        ('welcome_message', '"Welcome to AskBox! How can I help you today?"', 'Greeting message for callers'),
        ('supported_languages', '["en", "hi", "ta", "te", "kn", "ml", "bn", "mr"]', 'List of supported languages'),
        ('openai_temperature', '0.7', 'Azure OpenAI temperature parameter'),
        ('openai_max_tokens', '800', 'Azure OpenAI max tokens parameter'),
        ('max_call_duration', '600', 'Maximum call duration in seconds'),
        ('system_prompt', '"You are AskBox, an educational assistant for rural students."', 'System prompt for Azure OpenAI')
      ON CONFLICT (key) DO NOTHING
    `);

        await client.query('COMMIT');
        logger.info('Database migrations completed successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Migration failed', { error });
        throw error;
    } finally {
        client.release();
    }
}

// Run migrations when executed directly
runMigrations()
    .then(() => {
        logger.info('Migrations done. Exiting.');
        process.exit(0);
    })
    .catch((err) => {
        logger.error('Migration script failed', { error: err });
        process.exit(1);
    });
