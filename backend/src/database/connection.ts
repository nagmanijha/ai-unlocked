import { Pool } from 'pg';
import { config } from '../config';
import { logger } from '../config/logger';

/** PostgreSQL connection pool — reused across all requests */
export const pool = new Pool({
    connectionString: config.databaseUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
    logger.error('Unexpected PostgreSQL pool error', { error: err.message });
});

/** Test database connectivity — non-fatal in dev mode */
export async function testConnection(): Promise<void> {
    try {
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        logger.info('PostgreSQL connection established successfully');
    } catch (error) {
        logger.warn('PostgreSQL not available — running in mock/limited mode. Knowledge base, auth and settings endpoints will not work until Postgres is running.', { error });
        // Do NOT throw — let the server start so the voice pipeline and mock APIs still work
    }
}
