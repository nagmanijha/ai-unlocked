import { Pool } from 'pg';
/** PostgreSQL connection pool — reused across all requests */
export declare const pool: Pool;
/** Test database connectivity */
export declare function testConnection(): Promise<void>;
//# sourceMappingURL=connection.d.ts.map